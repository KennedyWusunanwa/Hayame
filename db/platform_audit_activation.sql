-- Platform Audit Activation Migration
-- Date: 2026-02-18
-- Safe to run multiple times.

begin;

-- -----------------------------------------------------------------------------
-- Profiles: verification + host level metadata
-- -----------------------------------------------------------------------------
alter table public.profiles add column if not exists region text;
alter table public.profiles add column if not exists id_verified boolean default false;
alter table public.profiles add column if not exists phone_verified boolean default false;
alter table public.profiles add column if not exists email_verified boolean default false;
alter table public.profiles add column if not exists host_level text default 'new_host';
alter table public.profiles add column if not exists updated_at timestamptz default now();

update public.profiles
set
  id_verified = coalesce(id_verified, false),
  phone_verified = coalesce(phone_verified, false),
  email_verified = coalesce(email_verified, false),
  host_level = coalesce(host_level, case when is_host then 'verified_host' else 'new_host' end),
  updated_at = coalesce(updated_at, created_at, now());

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_host_level_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_host_level_check
      check (host_level in ('new_host', 'verified_host', 'top_host', 'super_host'));
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Cars: listing quality + moderation + pricing metadata
-- -----------------------------------------------------------------------------
alter table public.cars add column if not exists brand text;
alter table public.cars add column if not exists model text;
alter table public.cars add column if not exists fuel_type text;
alter table public.cars add column if not exists car_year integer;
alter table public.cars add column if not exists delivery_available boolean default false;
alter table public.cars add column if not exists air_conditioning boolean default false;
alter table public.cars add column if not exists delivery_fee numeric default 0;
alter table public.cars add column if not exists insurance_fee numeric default 0;
alter table public.cars add column if not exists deposit_amount numeric default 0;
alter table public.cars add column if not exists cancellation_policy text default 'moderate';
alter table public.cars add column if not exists approval_status text default 'approved';
alter table public.cars add column if not exists reviewed_at timestamptz;
alter table public.cars add column if not exists reviewed_by text;
alter table public.cars add column if not exists rejection_reason text;

update public.cars
set
  car_year = coalesce(car_year, greatest(2000, extract(year from coalesce(created_at, now()))::int)),
  delivery_available = coalesce(delivery_available, false),
  air_conditioning = coalesce(
    air_conditioning,
    exists (
      select 1
      from unnest(coalesce(features, '{}')) as f
      where lower(f) = 'air conditioning'
    ),
    false
  ),
  delivery_fee = coalesce(delivery_fee, 0),
  insurance_fee = coalesce(insurance_fee, 0),
  deposit_amount = coalesce(deposit_amount, 0),
  cancellation_policy = coalesce(cancellation_policy, 'moderate'),
  approval_status = coalesce(approval_status, 'approved');

-- Handle both enum-backed and text-backed fuel_type columns safely.
do $$
declare
  fuel_type_udt text;
begin
  select c.udt_name
  into fuel_type_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'cars'
    and c.column_name = 'fuel_type';

  if fuel_type_udt = 'fuel_type' then
    execute $sql$
      update public.cars
      set fuel_type = coalesce(
        fuel_type,
        case
          when lower(coalesce(fuel::text, '')) in ('petrol', 'diesel', 'hybrid', 'electric')
            then lower(fuel::text)::fuel_type
          else null
        end,
        'petrol'::fuel_type
      )
    $sql$;
  else
    execute $sql$
      update public.cars
      set fuel_type = coalesce(
        nullif(lower(fuel_type::text), ''),
        case
          when lower(coalesce(fuel::text, '')) in ('petrol', 'diesel', 'hybrid', 'electric')
            then lower(fuel::text)
          else null
        end,
        'petrol'
      )
    $sql$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cars_cancellation_policy_check'
      and conrelid = 'public.cars'::regclass
  ) then
    alter table public.cars
      add constraint cars_cancellation_policy_check
      check (cancellation_policy in ('flexible', 'moderate', 'strict'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'cars_approval_status_check'
      and conrelid = 'public.cars'::regclass
  ) then
    alter table public.cars
      add constraint cars_approval_status_check
      check (approval_status in ('pending', 'approved', 'rejected'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'cars_non_negative_fees_check'
      and conrelid = 'public.cars'::regclass
  ) then
    alter table public.cars
      add constraint cars_non_negative_fees_check
      check (
        coalesce(delivery_fee, 0) >= 0
        and coalesce(insurance_fee, 0) >= 0
        and coalesce(deposit_amount, 0) >= 0
      );
  end if;
end $$;

create index if not exists idx_cars_approval_status on public.cars(approval_status);
create index if not exists idx_cars_owner_approval on public.cars(owner_id, approval_status);
create index if not exists idx_cars_fuel_type on public.cars(fuel_type);
create index if not exists idx_cars_car_year on public.cars(car_year);
create index if not exists idx_cars_delivery_available on public.cars(delivery_available);
create index if not exists idx_cars_air_conditioning on public.cars(air_conditioning);

-- -----------------------------------------------------------------------------
-- Bookings: charged fee breakdown
-- -----------------------------------------------------------------------------
alter table public.bookings add column if not exists nights integer;
alter table public.bookings add column if not exists daily_rate numeric;
alter table public.bookings add column if not exists subtotal numeric;
alter table public.bookings add column if not exists platform_fee numeric default 0;
alter table public.bookings add column if not exists insurance_fee numeric default 0;
alter table public.bookings add column if not exists delivery_fee numeric default 0;
alter table public.bookings add column if not exists deposit_amount numeric default 0;
alter table public.bookings add column if not exists updated_at timestamptz default now();

update public.bookings
set
  nights = coalesce(nights, greatest((end_date - start_date), 1)),
  daily_rate = coalesce(
    daily_rate,
    case
      when greatest((end_date - start_date), 1) > 0 then
        coalesce(total_price, 0) / greatest((end_date - start_date), 1)
      else
        coalesce(total_price, 0)
    end
  ),
  subtotal = coalesce(
    subtotal,
    coalesce(total_price, 0)
  ),
  platform_fee = coalesce(platform_fee, 0),
  insurance_fee = coalesce(insurance_fee, 0),
  delivery_fee = coalesce(delivery_fee, 0),
  deposit_amount = coalesce(deposit_amount, 0),
  updated_at = coalesce(updated_at, created_at, now());

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_non_negative_fee_breakdown_check'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_non_negative_fee_breakdown_check
      check (
        coalesce(nights, 0) >= 0
        and coalesce(daily_rate, 0) >= 0
        and coalesce(subtotal, 0) >= 0
        and coalesce(platform_fee, 0) >= 0
        and coalesce(insurance_fee, 0) >= 0
        and coalesce(delivery_fee, 0) >= 0
        and coalesce(deposit_amount, 0) >= 0
      );
  end if;
end $$;

create index if not exists idx_bookings_status_dates on public.bookings(status, start_date, end_date);

-- -----------------------------------------------------------------------------
-- Reviews: moderation flags
-- -----------------------------------------------------------------------------
alter table public.reviews add column if not exists is_hidden boolean default false;
alter table public.reviews add column if not exists moderated_at timestamptz;
alter table public.reviews add column if not exists moderated_by text;
alter table public.reviews add column if not exists moderation_reason text;

update public.reviews
set is_hidden = coalesce(is_hidden, false);

create index if not exists idx_reviews_car_hidden on public.reviews(car_id, is_hidden);

-- -----------------------------------------------------------------------------
-- Platform settings
-- -----------------------------------------------------------------------------
create table if not exists public.platform_settings (
  id integer primary key,
  platform_fee_percent numeric not null default 10,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.platform_settings (id, platform_fee_percent)
values (1, 10)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- Listing views (for host views/conversion metrics)
-- -----------------------------------------------------------------------------
create table if not exists public.listing_views (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete set null,
  session_key text,
  created_at timestamptz default now(),
  view_date date default ((now() at time zone 'utc')::date)
);

alter table public.listing_views add column if not exists view_date date;

update public.listing_views
set view_date = coalesce(view_date, (created_at at time zone 'utc')::date);

alter table public.listing_views alter column view_date set default ((now() at time zone 'utc')::date);
alter table public.listing_views alter column view_date set not null;

create index if not exists idx_listing_views_car_id on public.listing_views(car_id);
create index if not exists idx_listing_views_viewer_id on public.listing_views(viewer_id);
create index if not exists idx_listing_views_created_at on public.listing_views(created_at);

-- Avoid duplicate view inflation from repeated refreshes in the same day.
create unique index if not exists idx_listing_views_unique_daily
on public.listing_views (car_id, coalesce(viewer_id::text, session_key), view_date);

-- -----------------------------------------------------------------------------
-- Disputes workflow
-- -----------------------------------------------------------------------------
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  car_id uuid not null references public.cars(id) on delete cascade,
  opened_by uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open',
  resolution_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'disputes_status_check'
      and conrelid = 'public.disputes'::regclass
  ) then
    alter table public.disputes
      add constraint disputes_status_check
      check (status in ('open', 'under_review', 'resolved', 'closed'));
  end if;
end $$;

create index if not exists idx_disputes_booking_id on public.disputes(booking_id);
create index if not exists idx_disputes_car_id on public.disputes(car_id);
create index if not exists idx_disputes_status on public.disputes(status);

create unique index if not exists idx_disputes_open_per_booking
on public.disputes(booking_id)
where status in ('open', 'under_review');

-- -----------------------------------------------------------------------------
-- Shared updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_cars_updated_at on public.cars;
create trigger trg_cars_updated_at
before update on public.cars
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at
before update on public.bookings
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_platform_settings_updated_at on public.platform_settings;
create trigger trg_platform_settings_updated_at
before update on public.platform_settings
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists trg_disputes_updated_at on public.disputes;
create trigger trg_disputes_updated_at
before update on public.disputes
for each row
execute function public.set_updated_at_timestamp();

-- -----------------------------------------------------------------------------
-- Search view powering smart filters/sort
-- -----------------------------------------------------------------------------
create or replace view public.car_search_view as
with review_stats as (
  select
    r.car_id,
    round(avg(r.rating)::numeric, 1) as avg_rating,
    count(*)::int as reviews_count
  from public.reviews r
  where coalesce(r.is_hidden, false) = false
  group by r.car_id
),
booking_stats as (
  select
    b.car_id,
    count(*) filter (
      where b.status in ('awaiting_host', 'confirmed', 'completed', 'refunded')
    )::int as bookings_count
  from public.bookings b
  group by b.car_id
),
photo_choice as (
  select
    cp.car_id,
    (array_agg(cp.url order by cp.created_at asc nulls last))[1] as image_url
  from public.car_photos cp
  group by cp.car_id
)
select
  c.id,
  c.owner_id,
  c.title,
  c.description,
  c.daily_price,
  c.city,
  c.region,
  c.car_type,
  c.brand,
  c.model,
  c.seats,
  lower(coalesce(c.transmission, '')) as transmission,
  lower(coalesce(c.fuel_type, c.fuel, '')) as fuel_type,
  c.features,
  c.is_available,
  c.instant_book,
  c.delivery_available,
  c.air_conditioning,
  c.car_year as year,
  c.car_year,
  c.delivery_fee,
  c.insurance_fee,
  c.deposit_amount,
  c.cancellation_policy,
  c.approval_status,
  c.created_at,
  c.updated_at,
  coalesce(rs.avg_rating, 0)::numeric as avg_rating,
  coalesce(rs.reviews_count, 0)::int as reviews_count,
  coalesce(bs.bookings_count, 0)::int as bookings_count,
  coalesce(bs.bookings_count, 0)::int as trips_count,
  p.full_name as host_name,
  p.avatar_url as host_avatar,
  p.id_verified,
  p.phone_verified,
  p.email_verified,
  p.host_level,
  case
    when lower(coalesce(p.host_level, '')) in ('top_host', 'super_host') then 'top_host'
    when coalesce(p.id_verified, false)
      and coalesce(p.phone_verified, false)
      and coalesce(p.email_verified, false) then 'verified'
    else 'new'
  end as host_type,
  ph.image_url
from public.cars c
left join public.profiles p on p.id = c.owner_id
left join review_stats rs on rs.car_id = c.id
left join booking_stats bs on bs.car_id = c.id
left join photo_choice ph on ph.car_id = c.id;

grant select on public.car_search_view to anon, authenticated;

-- -----------------------------------------------------------------------------
-- RLS for new tables
-- -----------------------------------------------------------------------------
alter table public.platform_settings enable row level security;
alter table public.listing_views enable row level security;
alter table public.disputes enable row level security;
grant select on public.platform_settings to anon, authenticated;
grant select, insert on public.listing_views to anon, authenticated;
grant select, insert on public.disputes to authenticated;

drop policy if exists "Platform settings readable" on public.platform_settings;
create policy "Platform settings readable" on public.platform_settings
  for select using (true);

drop policy if exists "Listing views insert" on public.listing_views;
create policy "Listing views insert" on public.listing_views
  for insert with check (viewer_id is null or viewer_id = auth.uid());

drop policy if exists "Listing views select owner_or_viewer" on public.listing_views;
create policy "Listing views select owner_or_viewer" on public.listing_views
  for select using (
    viewer_id = auth.uid()
    or exists (
      select 1
      from public.cars c
      where c.id = listing_views.car_id
        and c.owner_id = auth.uid()
    )
  );

drop policy if exists "Disputes select participant" on public.disputes;
create policy "Disputes select participant" on public.disputes
  for select using (
    opened_by = auth.uid()
    or exists (
      select 1
      from public.bookings b
      join public.cars c on c.id = b.car_id
      where b.id = disputes.booking_id
        and (b.renter_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

drop policy if exists "Disputes insert participant" on public.disputes;
create policy "Disputes insert participant" on public.disputes
  for insert with check (
    opened_by = auth.uid()
    and exists (
      select 1
      from public.bookings b
      join public.cars c on c.id = b.car_id
      where b.id = disputes.booking_id
        and (b.renter_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

commit;
