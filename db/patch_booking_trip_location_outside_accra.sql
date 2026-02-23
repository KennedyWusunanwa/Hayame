alter table public.cars
  add column if not exists outside_accra_fee numeric default 0;

alter table public.bookings
  add column if not exists trip_use_region text,
  add column if not exists trip_use_city text,
  add column if not exists trip_use_address text,
  add column if not exists trip_outside_accra boolean default false,
  add column if not exists trip_outside_listing_region boolean default false,
  add column if not exists outside_accra_surcharge numeric default 0;
