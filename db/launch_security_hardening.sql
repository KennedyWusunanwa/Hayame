-- ============================================================================
-- Launch security hardening — close client-side payment/role bypass holes.
--
-- Problem (pre-launch audit, confirmed):
--   * bookings UPDATE RLS had no WITH CHECK -> a renter (or host) could flip
--     their own booking to status='confirmed', payment_status='paid' directly
--     via the Supabase anon REST API, getting a FREE confirmed rental without
--     paying Paystack.
--   * profiles UPDATE RLS had no WITH CHECK -> any user could self-grant
--     is_host / verified-host badges and skip host application review.
--
-- Fix: column-aware BEFORE INSERT/UPDATE triggers that reject any attempt by a
-- non-privileged role (anon / authenticated) to set or change protected
-- payment/status/verification columns. Only the service-role API (server code)
-- may perform those transitions. RLS still governs row visibility/ownership.
--
-- Safe for existing flows:
--   * Client profile edits (full_name, avatar, phone, city) are untouched.
--   * Renter "hold" inserts (status='pending', payment_status='pending') pass.
--   * All confirm/refund/approve transitions run via createSupabaseAdminClient()
--     (service_role) in the API, which is treated as privileged here.
-- Idempotent: safe to run multiple times.
-- ============================================================================

-- Roles that are allowed to mutate protected columns (server / migrations only).
create or replace function public.hayame_is_privileged()
returns boolean
language sql
stable
as $$
  select current_user in (
    'service_role', 'postgres', 'supabase_admin', 'supabase_auth_admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- bookings: only the service role may set/modify money + lifecycle columns.
-- ---------------------------------------------------------------------------
create or replace function public.hayame_guard_booking_columns()
returns trigger
language plpgsql
as $$
begin
  if public.hayame_is_privileged() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A renter may only ever insert a fresh, unpaid hold.
    if coalesce(new.status::text, 'pending') <> 'pending' then
      raise exception 'Only pending holds may be created by clients'
        using errcode = '42501';
    end if;
    if coalesce(new.payment_status, 'pending') <> 'pending' then
      raise exception 'payment_status may not be set by clients'
        using errcode = '42501';
    end if;
    if new.paid_at is not null
       or new.approved_at is not null
       or new.rejected_at is not null
       or new.payment_reference is not null
       or new.payment_provider is not null
       or new.refund_reference is not null then
      raise exception 'Payment fields may not be set by clients'
        using errcode = '42501';
    end if;
    -- Cap client-created holds so a malicious insert can't park a long-lived
    -- "pending" hold to block a car's calendar.
    if new.hold_expires_at is not null
       and new.hold_expires_at > now() + interval '1 hour' then
      raise exception 'hold_expires_at is too far in the future'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.status            is distinct from old.status
       or new.payment_status    is distinct from old.payment_status
       or new.total_price       is distinct from old.total_price
       or new.paid_at           is distinct from old.paid_at
       or new.approved_at       is distinct from old.approved_at
       or new.rejected_at       is distinct from old.rejected_at
       or new.payment_reference is distinct from old.payment_reference
       or new.payment_provider  is distinct from old.payment_provider
       or new.refund_reference  is distinct from old.refund_reference
       or new.hold_expires_at   is distinct from old.hold_expires_at then
      raise exception 'Protected booking fields may only be changed server-side'
        using errcode = '42501';
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_booking_columns on public.bookings;
create trigger trg_guard_booking_columns
before insert or update on public.bookings
for each row
execute function public.hayame_guard_booking_columns();

-- ---------------------------------------------------------------------------
-- profiles: only the service role may set host / verification flags.
-- ---------------------------------------------------------------------------
create or replace function public.hayame_guard_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if public.hayame_is_privileged() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.is_host, false) is true
       or new.host_level is not null
       or new.host_approved_at is not null
       or coalesce(new.id_verified, false) is true
       or coalesce(new.phone_verified, false) is true
       or coalesce(new.email_verified, false) is true then
      raise exception 'Host / verification flags may not be set by clients'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.is_host          is distinct from old.is_host
       or new.host_level       is distinct from old.host_level
       or new.host_approved_at is distinct from old.host_approved_at
       or new.id_verified      is distinct from old.id_verified
       or new.phone_verified   is distinct from old.phone_verified
       or new.email_verified   is distinct from old.email_verified then
      raise exception 'Host / verification flags may only be changed server-side'
        using errcode = '42501';
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_profile_columns on public.profiles;
create trigger trg_guard_profile_columns
before insert or update on public.profiles
for each row
execute function public.hayame_guard_profile_columns();
