# Booking System (Hayame)

**Purpose**
This document explains how the Hayame booking system works end-to-end: availability, holds, payments, approvals, and data integrity safeguards.

**Key Concepts**

- `end_date` is **checkout day** and is **exclusive** for blocking and pricing.
- A **pending hold** reserves dates for ~15 minutes during checkout.
- Cars can be **Instant Book** or **Host Approval**.
- `cars.is_available = false` makes a car entirely unbookable.
- A database trigger blocks overlapping **active** bookings.

**Data Model (Core Fields)**

- `public.cars`
  - `is_available` boolean
  - `instant_book` boolean
- `public.bookings`
  - `start_date`, `end_date` (exclusive end)
  - `status` (`pending`, `awaiting_host`, `confirmed`, `rejected`, `cancelled`, `completed`, `refunded`)
  - `hold_expires_at` (timestamptz)
  - `payment_status`, `payment_reference`, `payment_provider`, `approved_at`
- `public.car_availability`
  - `start_date`, `end_date` (exclusive end)
  - `available` boolean

Schema and guard logic live in `db/migration.sql`.

**Status & Payment Meaning**

- `pending`: pre-payment hold; blocks dates only while `hold_expires_at > now()`.
- `awaiting_host`: paid, waiting for host approval.
- `confirmed`: approved/instant-booked.
- `rejected`: host rejected.
- `cancelled`: hold expired or invalidated.
- `completed`: finished rental.
- `refunded`: payment returned.
- `payment_status` uses `pending`, `paid`, `failed`, `refunded`.

**Date Semantics**

- All overlap checks use `[start_date, end_date)` (exclusive end).
- Nights charged = difference in calendar days between end and start.
- Checkout day is never blocked or billed.

**Availability Read Path**
File: `src/app/api/availability/route.ts`

- Validates and parses dates.
- If `cars.is_available = false`, returns `available=false`.
- Fetches `car_availability` blocks with overlap rule:
  - `block.start < end AND block.end > start`
- Fetches bookings with statuses `pending`, `awaiting_host`, `confirmed`.
  - Pending holds only block if `hold_expires_at` is null or in the future.
- Expands blocks into day-by-day `blockedDates` using exclusive end.
- Returns `available=true` only if no overlap.

**Availability Write Path**
File: `src/app/api/availability/route.ts`

- Validates `startDate < endDate`.
- Weekly blocks:
  - Only inserts rows for selected weekdays.
  - Does NOT block entire ranges.
- Single-day block is stored as `[day, day+1)` (exclusive end).

**Hold Creation (Pre-Payment Reservation)**
File: `src/app/api/bookings/hold/route.ts`

- Auth required.
- Validates date range and `cars.is_available`.
- Conflict check against:
  - `car_availability` blocks
  - bookings with status `pending`, `awaiting_host`, `confirmed`
  - pending holds only block if `hold_expires_at > now()`
- Creates booking with:
  - `status = 'pending'`
  - `payment_status = 'pending'`
  - `hold_expires_at = now() + 15 minutes`
- Returns `bookingId` and `hold_expires_at`.

**Payment Verification (Paystack)**
File: `src/app/api/bookings/paystack/route.ts`

- Accepts `bookingId` (preferred) or legacy fallback.
- Validates:
  - booking exists, belongs to user, status is `pending`
  - hold not expired
  - range still conflict-free
  - Paystack amount matches nights \* rate
- Final status:
  - `cars.instant_book = true` -> `confirmed` + `approved_at`
  - else -> `awaiting_host`
- Sets:
  - `payment_status = 'paid'`
  - `payment_reference`, `payment_provider`
  - `hold_expires_at = null`

**Host Approval**
File: `src/app/api/bookings/[id]/route.ts`

- Approve -> `confirmed`, set `approved_at`.
- Reject -> `rejected`, refund, `payment_status = 'refunded'`.

**UI Booking Flow**
File: `src/components/booking-widget.tsx`

- User selects dates and clicks **Book now**.
- Creates hold via `/api/bookings/hold`.
- Shows countdown until `hold_expires_at`.
- Opens Paystack checkout.

**Host Contact Reveal in Messages**
Files:

- `src/components/messages/chat-thread.tsx`
- `src/components/messages/messaging-provider.tsx`

Behavior:

- After a successful booking (status in `awaiting_host`, `confirmed`, `completed`, `refunded`),
  the renter can see the host’s **full name**, **location**, and **phone number** inside the chat thread.
- Before booking (or if booking is `pending`, `cancelled`, or `rejected`), the contact details are hidden.
- RLS policy allows renters to read host profiles only when a qualifying booking exists.

**Email Notifications (Resend)**
Files:

- `src/lib/email.ts`
- `src/app/api/messages/route.ts`
- `src/app/api/bookings/paystack/route.ts`
- `src/app/api/bookings/[id]/route.ts`
- `src/app/admin/page.tsx`

Events:

- New message received (email to recipient).
- Host application approved/rejected (email to applicant).
- Booking payment verified (email to renter + host notice).
- Booking approved/rejected by host (email to renter).

Environment:

- `RESEND_API_KEY` (server-only)
- `RESEND_FROM` (verified sender, e.g. `Hayame <no-reply@yourdomain.com>`)
- Optional: `APP_NAME`, `NEXT_PUBLIC_SITE_URL`
- Optional: `EMAIL_BASE_URL` (overrides links in emails; use `https://hayame.vercel.app`)

**Overlap Guard (DB Trigger)**
File: `db/migration.sql`

- Trigger `prevent_overlapping_active_bookings` blocks overlaps for:
  - `awaiting_host`, `confirmed`
- Uses advisory lock per car to reduce race conditions.
- Prevents double-booking without relying on GiST UUID opclasses.

**Failure Cases**

- Payment fails or hold expires:
  - booking no longer blocks availability
  - can be marked `cancelled` later
- If hold is missing or expired, payment verification fails safely.

**Sanity Checks**

- Use the read-only checks provided in the SQL sanity list.
- Confirm:
  - No active overlaps
  - No invalid date ranges
  - No pending bookings missing holds
  - `cars.is_available` enforced

**Related References**

- `src/app/api/availability/route.ts`
- `src/app/api/bookings/hold/route.ts`
- `src/app/api/bookings/paystack/route.ts`
- `src/app/api/bookings/[id]/route.ts`
- `src/components/booking-widget.tsx`
- `src/components/date-range-picker.tsx`
- `src/components/availability-form.tsx`
- `docs/booking-flow-test-plan.md`
- `db/migration.sql`
