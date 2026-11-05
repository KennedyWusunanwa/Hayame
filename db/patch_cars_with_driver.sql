-- "Comes with a driver": the host (or their chauffeur) drives; guests do not
-- self-drive. Shown as a "With driver" tag on cards and detail pages.
--
-- Apply before deploying the matching release: the mobile list endpoint
-- selects the column from car_search_view. Same append-to-live-view approach
-- as db/patch_cars_allow_one_day_booking.sql.

alter table public.cars
  add column if not exists with_driver boolean not null default false;

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
      and column_name = 'with_driver'
  ) then
    return;
  end if;

  current_def := rtrim(pg_get_viewdef('public.car_search_view'::regclass, true), E'; \n');
  execute format(
    'create or replace view public.car_search_view as '
    || 'select v.*, coalesce(c.with_driver, false) as with_driver '
    || 'from (%s) v left join public.cars c on c.id = v.id',
    current_def
  );
end $$;

grant select on public.car_search_view to anon, authenticated;
