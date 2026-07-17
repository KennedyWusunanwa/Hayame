-- First-party product analytics (admin-only).
--
-- Privacy posture (Apple App Privacy / Ghana Act 843 / GDPR defensible):
--   * This is FIRST-PARTY analytics only: it records how people use Hayame's
--     own marketplace. It is never shared with ad networks or data brokers and
--     is never linked to activity on any other company's app or website.
--     That distinction is what keeps this outside Apple's definition of
--     "tracking" (no ATT prompt required) and outside the ePrivacy definition
--     of third-party/advertising storage.
--   * NEVER store: names, emails, phone numbers, ID numbers, ID images,
--     payment details, precise GPS coordinates, IP addresses, device
--     advertising identifiers (IDFA), or any raw request bodies.
--   * user_id is our own internal Supabase UUID (nullable) so a signed-in
--     journey can be understood. session_key is a pseudonymous client-side id.
--   * `props` is structured, non-PII context only (e.g. a region name, a price
--     bucket, a car id). The ingest route allowlists keys; see
--     src/app/api/analytics/route.ts.
--   * RLS is enabled with NO public policies, so only the service role (the
--     admin client) can read. End users cannot read this table. Inserts go
--     through the API route, not directly from the browser.
--
-- Run this in the Supabase SQL editor.

-- -----------------------------------------------------------------------------
-- Event stream
-- -----------------------------------------------------------------------------

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_date date not null default ((now() at time zone 'utc')::date),

  -- What happened
  name text not null,                  -- e.g. 'search', 'car_view', 'booking_completed'
  props jsonb not null default '{}',   -- allowlisted, non-PII structured context

  -- Who (pseudonymous)
  user_id uuid references public.profiles(id) on delete set null,
  session_key text,                    -- client-generated pseudonymous id

  -- Where
  platform text not null default 'web',  -- 'web' | 'ios'
  app_version text,
  path text,                           -- in-app route, query string stripped

  -- Journey stitching
  referrer_host text                   -- hostname only, never the full URL
);

create index if not exists idx_analytics_events_created
  on public.analytics_events(created_at desc);
create index if not exists idx_analytics_events_name_created
  on public.analytics_events(name, created_at desc);
create index if not exists idx_analytics_events_date
  on public.analytics_events(event_date);
create index if not exists idx_analytics_events_user
  on public.analytics_events(user_id);
create index if not exists idx_analytics_events_session
  on public.analytics_events(session_key);
-- Funnel queries filter by name then group by session; this covers that path.
create index if not exists idx_analytics_events_session_name
  on public.analytics_events(session_key, name, created_at);

alter table public.analytics_events enable row level security;
-- No policies on purpose: service role only. Writes go via the API route.

-- -----------------------------------------------------------------------------
-- Consent ledger
--
-- Proof-of-consent is a legal requirement, not a nicety: under GDPR Art. 7(1)
-- the controller must be able to DEMONSTRATE that consent was given. We keep a
-- minimal, append-only record. No IP address is stored (it is personal data and
-- is not needed to make the record useful).
-- -----------------------------------------------------------------------------

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_key text,
  user_id uuid references public.profiles(id) on delete set null,
  analytics boolean not null default false,
  policy_version text not null,        -- privacy policy version consented to
  platform text not null default 'web',
  user_agent_family text               -- coarse only, e.g. 'safari' — not the full UA string
);

create index if not exists idx_consent_records_session
  on public.consent_records(session_key, created_at desc);
create index if not exists idx_consent_records_user
  on public.consent_records(user_id, created_at desc);

alter table public.consent_records enable row level security;
-- No policies on purpose: service role only.

-- -----------------------------------------------------------------------------
-- Retention
--
-- Storage limitation (GDPR Art. 5(1)(e), Act 843 s.24) requires that we not keep
-- event-level data indefinitely. Raw events are pruned after 400 days; the
-- rollups below are what we keep long-term. Schedule this with pg_cron if
-- available, or run it periodically.
-- -----------------------------------------------------------------------------

create or replace function public.prune_analytics_events()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.analytics_events
  where created_at < now() - interval '400 days';
$$;

-- -----------------------------------------------------------------------------
-- Aggregate views for the admin dashboard.
--
-- These are the long-lived artefacts. They are aggregate counts and contain no
-- individual-level data.
-- -----------------------------------------------------------------------------

create or replace view public.analytics_daily_counts as
select
  event_date,
  name,
  platform,
  count(*)                                  as events,
  count(distinct coalesce(user_id::text, session_key)) as uniques
from public.analytics_events
group by event_date, name, platform;

create or replace view public.analytics_search_terms as
select
  lower(trim(props ->> 'q'))  as term,
  count(*)                    as searches,
  count(distinct coalesce(user_id::text, session_key)) as searchers,
  max(created_at)             as last_searched
from public.analytics_events
where name = 'search'
  and coalesce(trim(props ->> 'q'), '') <> ''
group by lower(trim(props ->> 'q'));

-- Safe integer cast for jsonb props.
--
-- Postgres casts fail the whole query, not the offending row, so one bad value
-- in `props` would take a whole dashboard panel down. The API sanitiser already
-- coerces these keys to numbers, but this table will outlive any one version of
-- that code — and the ingest endpoint is public. Belt and braces.
create or replace function public.analytics_prop_int(props jsonb, key text)
returns int
language sql
immutable
returns null on null input
as $$
  select case
    when props ->> key ~ '^-?\d+$' then (props ->> key)::int
    else null
  end;
$$;

-- Searches that returned nothing: the highest-signal demand gap in a
-- marketplace. Tells you what people want that you do not list.
create or replace view public.analytics_zero_result_searches as
select
  lower(trim(props ->> 'q'))  as term,
  props ->> 'region'          as region,
  count(*)                    as searches,
  max(created_at)             as last_searched
from public.analytics_events
where name = 'search'
  and public.analytics_prop_int(props, 'results') = 0
  and coalesce(trim(props ->> 'q'), '') <> ''
group by lower(trim(props ->> 'q')), props ->> 'region';

-- -----------------------------------------------------------------------------
-- Aggregation RPCs for the admin dashboard.
--
-- These run the maths in Postgres rather than shipping raw event rows to Node.
-- That matters for privacy as much as performance: the app server only ever
-- receives aggregate counts, never an individual's event history.
--
-- security definer + a locked search_path so they can read the RLS-protected
-- table. They are granted to service_role ONLY — never to anon/authenticated.
-- -----------------------------------------------------------------------------

create or replace function public.analytics_funnel(days_back int default 30)
returns table (step text, sessions bigint)
language sql
security definer
set search_path = public
as $$
  with steps as (
    select * from (values
      (1, 'search'),
      (2, 'car_view'),
      (3, 'booking_started'),
      (4, 'booking_dates_selected'),
      (5, 'booking_payment_started'),
      (6, 'booking_completed')
    ) as t(ord, name)
  )
  select
    s.name::text as step,
    count(distinct coalesce(e.user_id::text, e.session_key)) as sessions
  from steps s
  left join public.analytics_events e
    on e.name = s.name
   and e.created_at >= now() - make_interval(days => days_back)
  group by s.ord, s.name
  order by s.ord;
$$;

create or replace function public.analytics_overview(days_back int default 30)
returns table (
  total_events bigint,
  unique_visitors bigint,
  searches bigint,
  car_views bigint,
  bookings_started bigint,
  bookings_completed bigint,
  zero_result_searches bigint,
  web_events bigint,
  ios_events bigint
)
language sql
security definer
set search_path = public
as $$
  select
    count(*)                                                       as total_events,
    count(distinct coalesce(user_id::text, session_key))           as unique_visitors,
    count(*) filter (where name = 'search')                        as searches,
    count(*) filter (where name = 'car_view')                      as car_views,
    count(*) filter (where name = 'booking_started')               as bookings_started,
    count(*) filter (where name = 'booking_completed')             as bookings_completed,
    count(*) filter (
      where name = 'search'
        and public.analytics_prop_int(props, 'results') = 0
    )                                                              as zero_result_searches,
    count(*) filter (where platform = 'web')                       as web_events,
    count(*) filter (where platform = 'ios')                       as ios_events
  from public.analytics_events
  where created_at >= now() - make_interval(days => days_back);
$$;

-- Why people drop out of the booking flow, ranked. This is the view most likely
-- to translate directly into revenue.
create or replace function public.analytics_abandon_reasons(days_back int default 30)
returns table (reason text, count bigint)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(props ->> 'reason', 'unknown')::text as reason,
    count(*)                                      as count
  from public.analytics_events
  where name = 'booking_abandoned'
    and created_at >= now() - make_interval(days => days_back)
  group by coalesce(props ->> 'reason', 'unknown')
  order by count desc;
$$;

create or replace function public.analytics_daily_trend(days_back int default 30)
returns table (day date, visitors bigint, searches bigint, bookings bigint)
language sql
security definer
set search_path = public
as $$
  select
    event_date                                              as day,
    count(distinct coalesce(user_id::text, session_key))    as visitors,
    count(*) filter (where name = 'search')                 as searches,
    count(*) filter (where name = 'booking_completed')      as bookings
  from public.analytics_events
  where created_at >= now() - make_interval(days => days_back)
  group by event_date
  order by event_date;
$$;

create or replace function public.analytics_consent_stats(days_back int default 30)
returns table (granted bigint, denied bigint)
language sql
security definer
set search_path = public
as $$
  -- One row per session: the latest decision wins, so a person who declined and
  -- later accepted is counted once, as granted.
  with latest as (
    select distinct on (coalesce(user_id::text, session_key, id::text))
      analytics
    from public.consent_records
    where created_at >= now() - make_interval(days => days_back)
    order by coalesce(user_id::text, session_key, id::text), created_at desc
  )
  select
    count(*) filter (where analytics)      as granted,
    count(*) filter (where not analytics)  as denied
  from latest;
$$;

-- Lock these down: service role only. Without these revokes, PostgREST would
-- expose them to anonymous callers and the RLS on the table would be moot.
revoke all on function public.analytics_funnel(int) from public, anon, authenticated;
revoke all on function public.analytics_overview(int) from public, anon, authenticated;
revoke all on function public.analytics_abandon_reasons(int) from public, anon, authenticated;
revoke all on function public.analytics_daily_trend(int) from public, anon, authenticated;
revoke all on function public.analytics_consent_stats(int) from public, anon, authenticated;
revoke all on function public.prune_analytics_events() from public, anon, authenticated;
-- analytics_prop_int is a pure helper over data the caller already supplies, so
-- it leaks nothing; it stays executable so the views can use it.

grant execute on function public.analytics_funnel(int) to service_role;
grant execute on function public.analytics_overview(int) to service_role;
grant execute on function public.analytics_abandon_reasons(int) to service_role;
grant execute on function public.analytics_daily_trend(int) to service_role;
grant execute on function public.analytics_consent_stats(int) to service_role;
grant execute on function public.prune_analytics_events() to service_role;

-- Same for the views. A view does NOT inherit the underlying table's RLS when
-- it is owned by a privileged role, so without these revokes the search-terms
-- view would be readable by anyone with the anon key.
revoke all on public.analytics_daily_counts from public, anon, authenticated;
revoke all on public.analytics_search_terms from public, anon, authenticated;
revoke all on public.analytics_zero_result_searches from public, anon, authenticated;

grant select on public.analytics_daily_counts to service_role;
grant select on public.analytics_search_terms to service_role;
grant select on public.analytics_zero_result_searches to service_role;
