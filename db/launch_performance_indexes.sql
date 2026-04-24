-- Launch performance indexes for high-traffic booking, messaging, and dashboard paths.
-- Safe to run multiple times.

begin;

create index if not exists idx_bookings_car_status_dates
  on public.bookings (car_id, status, start_date, end_date);

create index if not exists idx_bookings_renter_status_created
  on public.bookings (renter_id, status, created_at desc);

create index if not exists idx_bookings_payment_reference
  on public.bookings (payment_reference)
  where payment_reference is not null;

create index if not exists idx_bookings_paid_provider_reference
  on public.bookings (payment_provider, payment_reference)
  where payment_reference is not null;

create index if not exists idx_bookings_hold_expiry
  on public.bookings (car_id, hold_expires_at)
  where status = 'pending' and hold_expires_at is not null;

create index if not exists idx_favorites_user_car
  on public.favorites (user_id, car_id);

create index if not exists idx_favorites_car
  on public.favorites (car_id);

create index if not exists idx_car_photos_car_created
  on public.car_photos (car_id, created_at);

create index if not exists idx_car_availability_car_dates
  on public.car_availability (car_id, start_date, end_date);

create index if not exists idx_reviews_booking_user
  on public.reviews (booking_id, user_id);

create index if not exists idx_host_applications_status_created
  on public.host_applications (status, created_at desc);

do $$
begin
  if to_regclass('public.conversations') is not null then
    create index if not exists idx_conversations_host_last_message
      on public.conversations (host_id, last_message_at desc);
    create index if not exists idx_conversations_user_last_message
      on public.conversations (user_id, last_message_at desc);
    create index if not exists idx_conversations_booking
      on public.conversations (booking_id)
      where booking_id is not null;
  end if;

  if to_regclass('public.messages') is not null then
    create index if not exists idx_messages_conversation_created
      on public.messages (conversation_id, created_at);
    create index if not exists idx_messages_conversation_unread
      on public.messages (conversation_id, read_at)
      where read_at is null;
  end if;

  if to_regclass('public.mobile_push_tokens') is not null then
    create index if not exists idx_mobile_push_tokens_user_platform
      on public.mobile_push_tokens (user_id, platform);
  end if;

  if to_regclass('public.user_notification_preferences') is not null then
    create index if not exists idx_user_notification_preferences_user
      on public.user_notification_preferences (user_id);
  end if;

  if to_regclass('public.app_announcements') is not null then
    create index if not exists idx_app_announcements_audience_published
      on public.app_announcements (audience, published_at desc)
      where published_at is not null;
  end if;
end $$;

commit;
