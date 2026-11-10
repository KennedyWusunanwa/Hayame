-- Renter identity verification (face photo + driving licence front and back).
--
-- A renter may only hold dates / pay once their latest submission is approved
-- by an admin. Safe to run more than once. Run this in the Supabase SQL editor
-- BEFORE deploying the code that reads it: until this table exists the booking
-- gate stays off (bookings keep working, nobody can submit a verification).
--
-- The photos live in the existing private `host-ids` bucket under
-- `<user id>/renter-*.jpg`; the bucket's owner-only policies already cover them.

create table if not exists public.renter_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  face_path text not null,
  licence_front_path text not null,
  licence_back_path text not null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_renter_verifications_user
  on public.renter_verifications (user_id, created_at desc);
create index if not exists idx_renter_verifications_status
  on public.renter_verifications (status, submitted_at desc);

-- One open submission per person: a double tap or two devices cannot queue
-- two reviews for the same renter.
create unique index if not exists uq_renter_verifications_one_pending
  on public.renter_verifications (user_id)
  where status = 'pending';

alter table public.renter_verifications enable row level security;

-- Renters may read their own rows. Every write (submit, approve, reject) goes
-- through the server with the service role, so there is deliberately no
-- insert / update / delete policy: a client can never approve itself.
drop policy if exists "Renter verifications owner read" on public.renter_verifications;
create policy "Renter verifications owner read" on public.renter_verifications
  for select using (auth.uid() = user_id);

revoke insert, update, delete on public.renter_verifications from anon, authenticated;

-- Storage: let a signed-in person add, read and replace files inside their own
-- folder (`<their user id>/...`) of the private `host-ids` bucket. The bucket's
-- original owner-based policies stay as they are; these are added alongside
-- them so a renter who is not a host can always upload their three photos.
drop policy if exists "Renter verification own folder insert" on storage.objects;
create policy "Renter verification own folder insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'host-ids'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Renter verification own folder read" on storage.objects;
create policy "Renter verification own folder read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'host-ids'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Renter verification own folder update" on storage.objects;
create policy "Renter verification own folder update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'host-ids'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'host-ids'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Make the new table visible to the API straight away.
notify pgrst, 'reload schema';
