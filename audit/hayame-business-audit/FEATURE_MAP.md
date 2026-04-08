# FEATURE_MAP

Status legend:

- `complete`: implemented and wired end-to-end in current codebase.
- `partial`: implemented but with placeholder/static data, operational dependency, or schema mismatch risk.
- `planned`: visible intent/placeholders, not operational yet.

## Renter features

| Feature              | Description                                                                                         | Status   |
| -------------------- | --------------------------------------------------------------------------------------------------- | -------- |
| Signup/login/logout  | Email/password auth with Supabase; mobile auth routes available                                     | complete |
| Explore listings     | Browse approved listings feed from `car_search_view`                                                | complete |
| Advanced filters     | Region/city, type, brand/model, fuel, transmission, seats, year, price, rating, host type, features | complete |
| Sorting              | Price low/high, most booked, top rated, new listings                                                | complete |
| Map panel            | Explore map component exists but disabled by feature flag                                           | partial  |
| Car details          | Gallery, details, host info, features, availability preview                                         | complete |
| Favorites            | Toggle favorites and view saved cars                                                                | complete |
| Booking hold         | 15-minute pre-payment hold and conflict checks                                                      | complete |
| Booking payment      | Paystack checkout + server verification/finalization                                                | complete |
| Booking list         | Renter view of upcoming/past bookings with statuses                                                 | complete |
| Trip dispute opening | Renter can open disputes tied to booking                                                            | complete |
| Reviews              | Completed-trip-only, one review per booking per user                                                | complete |
| Contact/support page | UI exists but form submit is not wired to backend                                                   | partial  |

## Host features

| Feature                  | Description                                                          | Status   |
| ------------------------ | -------------------------------------------------------------------- | -------- |
| Become-host flow         | Host application form with KYC fields and ID image upload            | complete |
| Host approval states     | Pending/approved/rejected status handling                            | complete |
| Host route guard         | `/host/*` access restricted to approved hosts                        | complete |
| Host dashboard KPIs      | Earnings, booking pipeline, views, conversion, review metrics        | complete |
| Listing CRUD             | Create/update/delete own listings with validation                    | complete |
| Photo management         | Upload/replace/delete listing photos; max count and size constraints | complete |
| Availability management  | Date window and recurring weekday blocks                             | complete |
| Booking decisioning      | Approve/reject awaiting_host bookings                                | complete |
| Host favorites analytics | Favorites by listing + counts                                        | complete |
| Host reviews page        | Host-facing review list                                              | complete |
| Host earnings page       | Separate page shows sample payouts (not live payout ledger)          | partial  |

## Admin features

| Feature                     | Description                                             | Status   |
| --------------------------- | ------------------------------------------------------- | -------- |
| Admin auth                  | Env credential + cookie gate (`admin_auth`)             | partial  |
| Host application moderation | Approve/reject, audit log write, decision email         | complete |
| Listing moderation          | Approve/reject pending listings, delete listing         | complete |
| Refund control              | Refund paid bookings (Paystack refund + status updates) | complete |
| Review moderation           | Hide/unhide reviews with reason tracking                | complete |
| Dispute management          | Update dispute status and resolution note               | complete |
| Filter catalog management   | CRUD for car makes/models                               | complete |
| Office messaging            | Admin-user direct conversations and messaging console   | complete |
| User profile/admin edit     | Admin user detail page with profile/application edits   | complete |
| Automated payout settlement | No host payout pipeline implemented                     | planned  |

## Trust and safety

| Feature                       | Description                                                           | Status   |
| ----------------------------- | --------------------------------------------------------------------- | -------- |
| Host identity document upload | Front/back ID images uploaded to private `host-ids` bucket            | complete |
| Host vetting workflow         | Application review and manual approval by admin                       | complete |
| Verification badges           | ID/phone/email/host level fields shown as trust badges                | partial  |
| Contact reveal gating         | Renter sees host contact details only after qualifying booking states | complete |
| Review integrity controls     | Completed-trip-only review inserts + admin moderation toggle          | complete |
| Dispute workflow              | Participant-only dispute opening and admin lifecycle updates          | complete |
| Insurance policy engine       | Protection page states coverage terms are coming soon                 | planned  |
| Fraud/risk scoring            | No dedicated fraud detection engine found                             | planned  |

## Payments

| Feature                         | Description                                                     | Status   |
| ------------------------------- | --------------------------------------------------------------- | -------- |
| Paystack transaction initialize | Mobile-specific initiation endpoint and checkout URL generation | complete |
| Paystack verify/finalize        | Server verifies amount/status, finalizes booking status         | complete |
| Refunds                         | Host rejection and admin refund call `refundPaystack`           | complete |
| Platform fee                    | Percent from `platform_settings` (fallback env)                 | complete |
| Multi-provider payments         | No Stripe/Flutterwave/PayPal integration found                  | planned  |

## Messaging

| Feature                     | Description                                        | Status   |
| --------------------------- | -------------------------------------------------- | -------- |
| Conversation create/find    | Car-linked and admin-office conversation paths     | complete |
| Message send/read           | Thread retrieval, post message, mark read          | complete |
| Unread counts               | Computed unread counts in APIs and clients         | complete |
| Realtime updates            | Supabase realtime used in messaging provider       | complete |
| Post-booking chat deep-link | Booking/payment flow routes user into conversation | complete |

## Notifications

| Feature                 | Description                                                               | Status   |
| ----------------------- | ------------------------------------------------------------------------- | -------- |
| Email notifications     | Message, booking paid, host decision, host-app decision emails via Resend | complete |
| Push token registration | Mobile push token registration endpoint + table                           | partial  |
| Push campaign delivery  | No push delivery service/worker found                                     | planned  |
| In-app badges           | Navbar and dashboard badges for unread/pending                            | complete |

## Booking engine

| Feature                 | Description                                                           | Status   |
| ----------------------- | --------------------------------------------------------------------- | -------- |
| Availability read model | Combines blocked windows + active bookings + expired hold cleanup     | complete |
| Hold lifecycle          | Pending hold with expiry and reuse behavior                           | complete |
| Conflict prevention     | API checks + DB trigger preventing overlapping active bookings        | complete |
| Status transitions      | pending/awaiting_host/confirmed/rejected/cancelled/completed/refunded | complete |
| Direct booking endpoint | Explicitly disabled in `/api/bookings`                                | complete |

## Pricing engine

| Feature                    | Description                                           | Status   |
| -------------------------- | ----------------------------------------------------- | -------- |
| Nightly subtotal           | `nights * daily_price`                                | complete |
| Platform fee               | Percent-based surcharge from settings/env             | complete |
| Add-on fees                | Insurance, delivery, deposit, outside-Accra surcharge | complete |
| Cancellation policy field  | Flexible/moderate/strict stored per listing           | partial  |
| Dynamic pricing automation | No demand-based pricing automation found              | planned  |

## Verification

| Feature                         | Description                                                       | Status   |
| ------------------------------- | ----------------------------------------------------------------- | -------- |
| Host approval flag              | `profiles.is_host` + host application status flow                 | complete |
| ID type/number capture          | Stored in host applications                                       | complete |
| Driver-license verification API | No external government/third-party verification integration found | planned  |
| KYC automation                  | Manual admin decision workflow; no automated KYC provider         | partial  |
