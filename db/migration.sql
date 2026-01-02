-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

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
  car_type text,
  seats integer,
  transmission text,
  fuel text,
  features text[],
  is_available boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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
create index if not exists idx_bookings_car on bookings(car_id);
create index if not exists idx_bookings_renter on bookings(renter_id);

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

-- Profiles: owners can read/update their profile
create policy if not exists "Users can view their profile" on profiles
  for select using (id = auth.uid());
create policy if not exists "Users can insert their profile" on profiles
  for insert with check (id = auth.uid());
create policy if not exists "Users can update their profile" on profiles
  for update using (id = auth.uid());

-- Cars: public read, owners manage
create policy if not exists "Cars are readable by anyone" on cars
  for select using (true);
create policy if not exists "Car owners can insert" on cars
  for insert with check (owner_id = auth.uid());
create policy if not exists "Car owners can update" on cars
  for update using (owner_id = auth.uid());
create policy if not exists "Car owners can delete" on cars
  for delete using (owner_id = auth.uid());

-- Car photos: public read, owners write
create policy if not exists "Car photos readable" on car_photos
  for select using (true);
create policy if not exists "Car photo owner write" on car_photos
  for insert with check (
    exists(select 1 from cars where cars.id = car_photos.car_id and cars.owner_id = auth.uid())
  );
create policy if not exists "Car photo owner update" on car_photos
  for update using (
    exists(select 1 from cars where cars.id = car_photos.car_id and cars.owner_id = auth.uid())
  );
create policy if not exists "Car photo owner delete" on car_photos
  for delete using (
    exists(select 1 from cars where cars.id = car_photos.car_id and cars.owner_id = auth.uid())
  );

-- Favorites: user-only
create policy if not exists "User favorites select" on favorites
  for select using (user_id = auth.uid());
create policy if not exists "User favorites insert" on favorites
  for insert with check (user_id = auth.uid());
create policy if not exists "User favorites delete" on favorites
  for delete using (user_id = auth.uid());

-- Bookings: renter read/write, owner read
create policy if not exists "Bookings select for renter or owner" on bookings
  for select using (
    renter_id = auth.uid()
    or exists(select 1 from cars where cars.id = bookings.car_id and cars.owner_id = auth.uid())
  );
create policy if not exists "Renter can insert booking" on bookings
  for insert with check (renter_id = auth.uid());
create policy if not exists "Renter or owner can update booking" on bookings
  for update using (
    renter_id = auth.uid()
    or exists(select 1 from cars where cars.id = bookings.car_id and cars.owner_id = auth.uid())
  );
create policy if not exists "Renter can delete booking" on bookings
  for delete using (renter_id = auth.uid());

-- Availability: owner only
create policy if not exists "Availability readable" on car_availability
  for select using (true);
create policy if not exists "Owner manages availability" on car_availability
  for all using (
    exists(select 1 from cars where cars.id = car_availability.car_id and cars.owner_id = auth.uid())
  ) with check (
    exists(select 1 from cars where cars.id = car_availability.car_id and cars.owner_id = auth.uid())
  );

-- Reviews: public read, renters with completed booking can write
create policy if not exists "Reviews readable" on reviews
  for select using (true);
create policy if not exists "Review author insert" on reviews
  for insert with check (
    user_id = auth.uid()
    and exists(
      select 1 from bookings
      where bookings.id = reviews.booking_id
        and bookings.renter_id = auth.uid()
        and bookings.status = 'completed'
    )
  );
create policy if not exists "Review author update" on reviews
  for update using (user_id = auth.uid());
create policy if not exists "Review author delete" on reviews
  for delete using (user_id = auth.uid());

-- Storage bucket for car photos
insert into storage.buckets (id, name, public)
values ('car-photos', 'car-photos', true)
on conflict (id) do nothing;

-- Storage RLS
create policy if not exists "Car photos public read" on storage.objects
  for select using (bucket_id = 'car-photos');
create policy if not exists "Car photos owner upload" on storage.objects
  for insert with check (bucket_id = 'car-photos' and owner = auth.uid());
create policy if not exists "Car photos owner update" on storage.objects
  for update using (bucket_id = 'car-photos' and owner = auth.uid());
create policy if not exists "Car photos owner delete" on storage.objects
  for delete using (bucket_id = 'car-photos' and owner = auth.uid());
