-- Enable extensions
create schema if not exists extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "btree_gist" with schema extensions;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type booking_status as enum ('pending', 'awaiting_host', 'confirmed', 'rejected', 'cancelled', 'completed', 'refunded');
  end if;
end$$;

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  full_name text,
  avatar_url text,
  phone text,
  city text,
  is_host boolean default false,
  host_approved_at timestamptz,
  created_at timestamptz default now()
);

-- Host applications
do $$
begin
  if not exists (select 1 from pg_type where typname = 'host_application_status') then
    create type host_application_status as enum ('pending', 'approved', 'rejected');
  end if;
end$$;

create table if not exists host_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  full_name text not null,
  phone text,
  region text,
  city text,
  id_type text,
  id_number text,
  id_front_path text,
  id_back_path text,
  note text,
  experience text,
  fleet_size integer,
  status host_application_status default 'pending'::host_application_status,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_host_applications_user on host_applications(user_id);

-- Host application column upgrades (safe for existing tables)
alter table host_applications add column if not exists id_type text;
alter table host_applications add column if not exists id_number text;
alter table host_applications add column if not exists note text;
alter table host_applications add column if not exists region text;
alter table host_applications add column if not exists id_front_path text;
alter table host_applications add column if not exists id_back_path text;
alter table host_applications add column if not exists submitted_at timestamptz;
alter table host_applications add column if not exists reviewed_by text;
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'host_applications' and column_name = 'reviewer'
  ) then
    alter table host_applications rename column reviewer to reviewed_by;
  end if;
exception when others then
  -- ignore if rename fails
end$$;

-- Admin audit log
create table if not exists admin_actions (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target_id uuid,
  target_type text,
  metadata jsonb,
  performed_by text,
  created_at timestamptz default now()
);

-- Locations
create table if not exists locations (
  id serial primary key,
  city text not null,
  region text,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

create table if not exists gh_regions (
  id serial primary key,
  name text not null unique
);

create table if not exists gh_districts (
  id serial primary key,
  region_id integer not null references gh_regions(id) on delete cascade,
  name text not null,
  capital text,
  category text,
  established_year integer,
  unique(region_id, name)
);

-- Cars
create table if not exists cars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  daily_price numeric not null,
  city text,
  region text,
  location_id integer references locations(id),
  outside_accra_fee numeric default 0,
  car_type text,
  seats integer,
  transmission text,
  fuel text,
  features text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table cars add column if not exists is_available boolean default true;
alter table cars add column if not exists instant_book boolean default false;
alter table cars add column if not exists outside_accra_fee numeric default 0;

-- Car photos
create table if not exists car_photos (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars(id) on delete cascade,
  url text not null,
  created_at timestamptz default now()
);

-- Favorites
create table if not exists favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  car_id uuid not null references cars(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, car_id)
);

-- Bookings
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars(id) on delete cascade,
  renter_id uuid not null references profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status booking_status default 'pending'::booking_status,
  delivery_address text,
  delivery_time text,
  contact_phone text,
  delivery_notes text,
  trip_use_region text,
  trip_use_city text,
  trip_use_address text,
  trip_outside_accra boolean default false,
  trip_outside_listing_region boolean default false,
  outside_accra_surcharge numeric default 0,
  total_price numeric,
  payment_status text default 'pending',
  payment_reference text,
  payment_provider text,
  paid_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  refund_reference text,
  created_at timestamptz default now()
);
alter table bookings add column if not exists hold_expires_at timestamptz;
alter table bookings add column if not exists delivery_address text;
alter table bookings add column if not exists delivery_time text;
alter table bookings add column if not exists contact_phone text;
alter table bookings add column if not exists delivery_notes text;
alter table bookings add column if not exists trip_use_region text;
alter table bookings add column if not exists trip_use_city text;
alter table bookings add column if not exists trip_use_address text;
alter table bookings add column if not exists trip_outside_accra boolean default false;
alter table bookings add column if not exists trip_outside_listing_region boolean default false;
alter table bookings add column if not exists outside_accra_surcharge numeric default 0;
create index if not exists idx_bookings_car on bookings(car_id);
create index if not exists idx_bookings_renter on bookings(renter_id);

-- Prevent overlapping active bookings for the same car (end_date is checkout/exclusive)
-- Supabase-safe approach: trigger-based overlap guard (no GiST UUID opclass needed)
alter table bookings drop constraint if exists bookings_no_overlap_active;

-- Clean up any overlapping active bookings so the guard can be created safely
update bookings b
set
  status = 'cancelled',
  payment_status = coalesce(b.payment_status, 'pending'),
  rejection_reason = coalesce(b.rejection_reason, 'auto-cancelled: overlap cleanup')
where b.status in ('awaiting_host', 'confirmed')
  and exists (
    select 1
    from bookings b2
    where b2.car_id = b.car_id
      and b2.status in ('awaiting_host', 'confirmed')
      and b2.id <> b.id
      and daterange(b2.start_date, b2.end_date, '[)') && daterange(b.start_date, b.end_date, '[)')
      and (coalesce(b2.created_at, 'epoch'::timestamptz), b2.id)
          < (coalesce(b.created_at, 'epoch'::timestamptz), b.id)
  );

create or replace function public.prevent_overlapping_active_bookings()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $$
begin
  -- Only enforce for real active bookings (NOT pending holds)
  if (new.status in ('awaiting_host', 'confirmed')) then
    -- Serialize per car to reduce race conditions.
    perform pg_advisory_xact_lock(hashtext(new.car_id::text)::bigint);

    if exists (
      select 1
      from bookings b
      where b.car_id = new.car_id
        and b.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and b.status in ('awaiting_host', 'confirmed')
        and daterange(b.start_date, b.end_date, '[)') && daterange(new.start_date, new.end_date, '[)')
    ) then
      raise exception 'Overlapping booking exists for car %', new.car_id
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_overlapping_active_bookings on bookings;

create trigger trg_prevent_overlapping_active_bookings
before insert or update of car_id, start_date, end_date, status
on bookings
for each row
execute function public.prevent_overlapping_active_bookings();

-- Availability windows
create table if not exists car_availability (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references cars(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  available boolean default true,
  created_at timestamptz default now()
);

-- Reviews
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  car_id uuid not null references cars(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table cars enable row level security;
alter table car_photos enable row level security;
alter table favorites enable row level security;
alter table bookings enable row level security;
alter table car_availability enable row level security;
alter table reviews enable row level security;
alter table host_applications enable row level security;
alter table admin_actions enable row level security;
alter table gh_regions enable row level security;
alter table gh_districts enable row level security;

drop policy if exists "Ghana regions readable" on gh_regions;
create policy "Ghana regions readable" on gh_regions
  for select using (true);
drop policy if exists "Ghana districts readable" on gh_districts;
create policy "Ghana districts readable" on gh_districts
  for select using (true);

-- Profiles: owners can read/update their profile
drop policy if exists "Users can view their profile" on profiles;
create policy "Users can view their profile" on profiles
  for select using (id = auth.uid());
drop policy if exists "Users can view host profile after booking" on profiles;
create policy "Users can view host profile after booking" on profiles
  for select using (
    exists (
      select 1
      from bookings b
      join cars c on c.id = b.car_id
      where b.renter_id = auth.uid()
        and c.owner_id = profiles.id
        and b.status in ('awaiting_host', 'confirmed', 'completed', 'refunded')
    )
  );
drop policy if exists "Users can insert their profile" on profiles;
create policy "Users can insert their profile" on profiles
  for insert with check (id = auth.uid());
drop policy if exists "Users can update their profile" on profiles;
create policy "Users can update their profile" on profiles
  for update using (id = auth.uid());

-- Cars: public read, owners manage
drop policy if exists "Cars are readable by anyone" on cars;
create policy "Cars are readable by anyone" on cars
  for select using (true);
drop policy if exists "Car owners can insert" on cars;
drop policy if exists "Car owners can insert if host" on cars;
create policy "Car owners can insert if host" on cars
  for insert with check (
    owner_id = auth.uid()
    and exists(select 1 from profiles where profiles.id = auth.uid() and profiles.is_host = true)
  );
drop policy if exists "Car owners can update" on cars;
create policy "Car owners can update" on cars
  for update using (owner_id = auth.uid());
drop policy if exists "Car owners can delete" on cars;
create policy "Car owners can delete" on cars
  for delete using (owner_id = auth.uid());

-- Car photos: public read, owners write
drop policy if exists "Car photos readable" on car_photos;
create policy "Car photos readable" on car_photos
  for select using (true);
drop policy if exists "Car photo owner write" on car_photos;
create policy "Car photo owner write" on car_photos
  for insert with check (
    exists(select 1 from cars where cars.id = car_photos.car_id and cars.owner_id = auth.uid())
  );
drop policy if exists "Car photo owner update" on car_photos;
create policy "Car photo owner update" on car_photos
  for update using (
    exists(select 1 from cars where cars.id = car_photos.car_id and cars.owner_id = auth.uid())
  );
drop policy if exists "Car photo owner delete" on car_photos;
create policy "Car photo owner delete" on car_photos
  for delete using (
    exists(select 1 from cars where cars.id = car_photos.car_id and cars.owner_id = auth.uid())
  );

-- Favorites: user-only
drop policy if exists "User favorites select" on favorites;
create policy "User favorites select" on favorites
  for select using (user_id = auth.uid());
drop policy if exists "User favorites insert" on favorites;
create policy "User favorites insert" on favorites
  for insert with check (user_id = auth.uid());
drop policy if exists "User favorites delete" on favorites;
create policy "User favorites delete" on favorites
  for delete using (user_id = auth.uid());

-- Bookings: renter read/write, owner read
drop policy if exists "Bookings select for renter or owner" on bookings;
create policy "Bookings select for renter or owner" on bookings
  for select using (
    renter_id = auth.uid()
    or exists(select 1 from cars where cars.id = bookings.car_id and cars.owner_id = auth.uid())
  );
drop policy if exists "Renter can insert booking" on bookings;
create policy "Renter can insert booking" on bookings
  for insert with check (renter_id = auth.uid());
drop policy if exists "Renter or owner can update booking" on bookings;
create policy "Renter or owner can update booking" on bookings
  for update using (
    renter_id = auth.uid()
    or exists(select 1 from cars where cars.id = bookings.car_id and cars.owner_id = auth.uid())
  );
drop policy if exists "Renter can delete booking" on bookings;
create policy "Renter can delete booking" on bookings
  for delete using (renter_id = auth.uid());

-- Availability: owner only
drop policy if exists "Availability readable" on car_availability;
create policy "Availability readable" on car_availability
  for select using (true);
drop policy if exists "Owner manages availability" on car_availability;
create policy "Owner manages availability" on car_availability
  for all using (
    exists(select 1 from cars where cars.id = car_availability.car_id and cars.owner_id = auth.uid())
  ) with check (
    exists(select 1 from cars where cars.id = car_availability.car_id and cars.owner_id = auth.uid())
  );

-- Reviews: public read, renters with completed booking can write
drop policy if exists "Reviews readable" on reviews;
create policy "Reviews readable" on reviews
  for select using (true);
drop policy if exists "Review author insert" on reviews;
create policy "Review author insert" on reviews
  for insert with check (
    user_id = auth.uid()
    and exists(
      select 1 from bookings
      where bookings.id = reviews.booking_id
        and bookings.renter_id = auth.uid()
        and bookings.status = 'completed'
    )
  );
drop policy if exists "Review author update" on reviews;
create policy "Review author update" on reviews
  for update using (user_id = auth.uid());
drop policy if exists "Review author delete" on reviews;
create policy "Review author delete" on reviews
  for delete using (user_id = auth.uid());

-- Host applications: user-only access
drop policy if exists "Host applications select own" on host_applications;
create policy "Host applications select own" on host_applications
  for select using (user_id = auth.uid());
drop policy if exists "Host applications insert own" on host_applications;
create policy "Host applications insert own" on host_applications
  for insert with check (user_id = auth.uid());

-- Storage bucket for car photos
insert into storage.buckets (id, name, public)
values ('car-photos', 'car-photos', true)
on conflict (id) do nothing;

-- Storage bucket for host ID images (private)
insert into storage.buckets (id, name, public)
values ('host-ids', 'host-ids', false)
on conflict (id) do nothing;

-- Storage RLS
drop policy if exists "Car photos public read" on storage.objects;
create policy "Car photos public read" on storage.objects
  for select using (bucket_id = 'car-photos');
drop policy if exists "Car photos owner upload" on storage.objects;
create policy "Car photos owner upload" on storage.objects
  for insert with check (bucket_id = 'car-photos' and owner = auth.uid());
drop policy if exists "Car photos owner update" on storage.objects;
create policy "Car photos owner update" on storage.objects
  for update using (bucket_id = 'car-photos' and owner = auth.uid());
drop policy if exists "Car photos owner delete" on storage.objects;
create policy "Car photos owner delete" on storage.objects
  for delete using (bucket_id = 'car-photos' and owner = auth.uid());

-- Host ID uploads (private bucket)
drop policy if exists "Host ID owner upload" on storage.objects;
create policy "Host ID owner upload" on storage.objects
  for insert with check (bucket_id = 'host-ids' and owner = auth.uid());
drop policy if exists "Host ID owner read" on storage.objects;
create policy "Host ID owner read" on storage.objects
  for select using (bucket_id = 'host-ids' and owner = auth.uid());
drop policy if exists "Host ID owner update" on storage.objects;
create policy "Host ID owner update" on storage.objects
  for update using (bucket_id = 'host-ids' and owner = auth.uid());
drop policy if exists "Host ID owner delete" on storage.objects;
create policy "Host ID owner delete" on storage.objects
  for delete using (bucket_id = 'host-ids' and owner = auth.uid());

-- Diagnostic error reports (admin-only). First-party diagnostics only:
-- no device tokens, emails, names, phones, or raw request bodies. RLS is
-- enabled with no public policies, so only the service role (admin client)
-- can read/write. See db/error-reports.sql for the full rationale.
create table if not exists error_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null default 'web',
  route text,
  method text,
  status integer,
  message text,
  code text,
  stack text,
  user_id uuid,
  app_version text,
  platform text,
  context jsonb,
  resolved boolean not null default false,
  resolved_at timestamptz
);
create index if not exists idx_error_reports_created
  on error_reports(created_at desc);
create index if not exists idx_error_reports_unresolved
  on error_reports(resolved, created_at desc);
alter table error_reports enable row level security;
