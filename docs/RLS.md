# RLS + Security

All tables are protected with row-level security. Service role key is **only** used for local seeding (`db/seed.ts`) and must never be exposed to the browser. Application code uses the anon key with session cookies so RLS enforces ownership.

## Tables & policies
- **profiles**
  - `select/update`: `id = auth.uid()`.
  - `select` (host contact reveal): renters can read host profile when a qualifying booking exists
    (`awaiting_host`, `confirmed`, `completed`, `refunded`).
- **cars**
  - Public read: `select true`.
  - Insert/Update/Delete: `owner_id = auth.uid()`.
- **car_photos**
  - Public read.
  - Insert/Update/Delete: owner of the related car (`exists(select 1 from cars where cars.id = car_photos.car_id and cars.owner_id = auth.uid())`).
- **favorites**
  - Select: `user_id = auth.uid() OR owner of the related car`.
  - Insert/Delete: `user_id = auth.uid()`.
- **bookings**
  - Select: renter or car owner (`renter_id = auth.uid() OR owner_of_car`).
  - Insert: `renter_id = auth.uid()`.
  - Update/Delete: renter or owner (same predicate as select for update, renter-only for delete).
- **car_availability**
  - Select: public.
  - All writes: owner of the related car.
- **reviews**
  - Select: public.
  - Insert: `user_id = auth.uid()` **and** booking exists with `status = 'completed'` for that renter/car.
  - Update/Delete: author only.

## Storage
- Bucket: `car-photos` (public read, owner write).
  - Select: `bucket_id = 'car-photos'`.
  - Insert/Update/Delete: `bucket_id = 'car-photos' AND owner = auth.uid()` (set owner on upload).

## Auth
- Supabase email/password auth via `@supabase/ssr`. Dashboard routes call `requireUser` to enforce authentication on the server.
- Route handlers run with the anon key + user session so RLS is authoritative; no service key is used in API handlers.
