-- Hosts opt a listing in to single-day trips. Off (the default) keeps the
-- 2-day minimum the booking flows enforce.
--
-- Apply this before deploying the matching app/server release: the mobile
-- list endpoint selects the column from car_search_view.

alter table public.cars
  add column if not exists allow_one_day_booking boolean not null default false;

-- car_search_view lists its columns explicitly, so the flag has to be appended
-- for the explore / mobile list endpoints. The live view has gained columns
-- that db/platform_audit_activation.sql does not know about, so append to
-- whatever definition is live instead of restating it. CREATE OR REPLACE VIEW
-- only allows new columns at the end, which is exactly what this does.
do $$
declare
  current_def text;
begin
  if not exists (
    select 1 from pg_views
    where schemaname = 'public' and viewname = 'car_search_view'
  ) then
    return;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'car_search_view'
      and column_name = 'allow_one_day_booking'
  ) then
    return;
  end if;

  current_def := rtrim(pg_get_viewdef('public.car_search_view'::regclass, true), E'; \n');
  execute format(
    'create or replace view public.car_search_view as '
    || 'select v.*, coalesce(c.allow_one_day_booking, false) as allow_one_day_booking '
    || 'from (%s) v left join public.cars c on c.id = v.id',
    current_def
  );
end $$;

grant select on public.car_search_view to anon, authenticated;
