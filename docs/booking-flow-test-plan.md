# Booking Flow Test Plan (Manual)

## Setup
1. Ensure Supabase schema is updated with new columns: `cars.instant_book`, `bookings.hold_expires_at`.
2. Ensure Paystack keys are configured in `.env.local` for end-to-end payment verification.
3. Create two users: a host with at least one car, and a renter.

## Holds And Availability
1. Renter selects dates and clicks **Book now**.
2. Confirm a hold is created and UI shows a countdown timer.
3. From another browser/user, verify the same dates are blocked in the calendar.
4. Wait 15 minutes (or manually expire by editing `hold_expires_at`) and confirm dates become available again.

## Instant Book vs Request-to-Book
1. Set `cars.instant_book = true`.
2. Complete Paystack checkout.
3. Verify booking status becomes `confirmed` immediately.
4. Set `cars.instant_book = false`.
5. Complete Paystack checkout.
6. Verify booking status becomes `awaiting_host` and host can approve/reject.

## Weekly Blocks
1. Host sets weekly blocks (e.g., Mon/Wed only) for 30 days.
2. Verify only those weekdays are blocked in the renter calendar.
3. Confirm non-selected weekdays remain bookable.

## End-Date Exclusive Logic
1. Create a booking from `2026-02-10` to `2026-02-12`.
2. Verify `2026-02-12` (checkout day) is NOT blocked for new bookings.
3. Verify pricing uses 2 nights (Feb 10–11).

## Car Availability Toggle
1. Set `cars.is_available = false`.
2. Verify availability API returns `available=false`.
3. Verify renter cannot create a hold or booking.

## Race Condition Smoke Test
1. Attempt to place two holds for the same car and date range at the same time.
2. Confirm only one succeeds and the other receives a conflict response.
