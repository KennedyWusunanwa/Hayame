# USER_JOURNEY

## Renter journey (current implemented flow)
1. `Sign up / log in`
- User creates account via web auth pages or mobile auth endpoints.
- Profile can be upserted with region/city and avatar.

2. `Discover`
- User lands on home/hero search or goes directly to Explore.
- Applies filters (location, type, brand/model, pricing, booking style, trust signals).

3. `Evaluate listing`
- Opens car detail page.
- Views photos, host trust badges, pricing breakdown inputs, availability preview.
- Can start conversation with host before booking.

4. `Reserve + pay`
- Booking widget validates dates and trip-use location.
- System creates pending hold (`~15 minutes`).
- Paystack checkout opens.
- Backend verifies Paystack transaction and amount.

5. `Booking state outcome`
- If instant-book listing: booking moves to `confirmed`.
- If host-approval listing: booking moves to `awaiting_host`.
- Conversation is ensured/linked for renter-host communication.

6. `Trip management`
- Renter sees booking statuses in dashboard.
- Can message host and open dispute if needed.

7. `Post-trip`
- Completed-trip-only review submission allowed (one review per booking).

## Host journey (current implemented flow)
1. `Create account`
- User starts as renter role by default.

2. `Apply to become host`
- Submits host application with identity and experience details.
- Uploads ID front/back images to private storage bucket.

3. `Admin review gate`
- Application status: `pending` -> `approved` or `rejected`.
- On approval, `profiles.is_host` and trust flags are set.

4. `Host operations`
- Access to `/host/*` dashboard after approval.
- Creates/edits listings (details, pricing, policies, features, photos, availability).
- Listing enters moderation workflow (`approval_status` pending/approved/rejected).

5. `Booking handling`
- Receives paid requests in `awaiting_host`.
- Approves (booking -> confirmed) or rejects (refund path triggered).
- Continues trip communication through messages.

6. `Performance monitoring`
- Tracks views, conversion, review counts, booking/earnings indicators.

## Admin journey (current implemented flow)
1. `Admin sign-in`
- Auth through env credentials + admin cookie.

2. `Host moderation`
- Reviews host applications.
- Approves/rejects with optional reason and audit log.

3. `Listing moderation`
- Reviews pending listings.
- Approves/rejects/deletes listings.

4. `Platform controls`
- Triggers booking refunds.
- Hides/unhides reviews.
- Updates dispute statuses and notes.

5. `Support operations`
- Uses admin office messaging console for user communication.
- Views/edits user profile and application metadata.

## Key system transitions
- Hold expiration: pending hold can auto-expire; expired hold no longer blocks availability.
- Overlap prevention: DB trigger blocks overlapping active bookings.
- Contact reveal: renter sees host phone/location in chat only after qualifying booking states.
- Email events: booking paid, host decisions, message notices, host-app decisions.

## Notable gaps in journey completeness
- Protection/insurance pages are placeholders.
- Contact form is UI-only in current web implementation.
- Host payout settlement is not automated end-to-end.
