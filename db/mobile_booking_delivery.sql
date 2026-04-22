-- Booking delivery/refund fields required by native checkout flows.
alter table public.bookings
  add column if not exists delivery_address text,
  add column if not exists delivery_time text,
  add column if not exists contact_phone text,
  add column if not exists delivery_notes text,
  add column if not exists refund_reference text;
