# Hayame Native App PRD + API Mapping

Date: 2026-03-09
Source of truth: current routes and API handlers in this repository (`src/app/**`, `src/app/api/**`).

## 1) Product goal

Build a fully functional iOS/Android app for Hayame that supports:

- Guest flows: discover, book, pay, message, favorites, profile.
- Host flows: onboarding, listing creation/editing, availability, booking approvals, earnings, reviews.
- Optional admin flows (recommended web-only first).

## 2) Roles and permissions

- Guest (renter): browse, favorite, book, pay, message host, review completed trips.
- Host (approved): all guest features plus listing and booking management.
- Admin: host/listing moderation, refunds, disputes, office messaging, catalog management.

## 3) Navigation architecture (native)

## 3.1 Primary app shells

Use two bottom-tab shells and switch by role:

- Guest tabs:
  - Home
  - Explore
  - Trips
  - Saved
  - Inbox
  - Profile

- Host tabs:
  - Host Home
  - Cars
  - Bookings
  - Earnings
  - Inbox
  - Profile

## 3.2 Web navbar parity (exact current behavior)

- Main links: `Home`, `Explore`, `Contact`.
- Feature-flagged links: `Prices` and `Blog` (currently off in `siteFlags`).
- Logged-out actions: `Log in`, `Sign up`.
- Logged-in guest actions: `Messages`, `Dashboard`, `Become a Host` (or `Application pending`), `Sign out`.
- Logged-in host actions: `Messages`, `Host dashboard`, `List Your Car & Earn`, `Sign out`.

## 4) Full page inventory from current web app

Total current page routes: 46.

## 4.1 Build as native screens (core)

- `/`
- `/explore`
- `/cars/[id]`
- `/messages`
- `/auth/login`
- `/auth/signup`
- `/dashboard`
- `/dashboard/bookings`
- `/dashboard/favorites`
- `/dashboard/profile`
- `/become-host`
- `/host`
- `/host/cars`
- `/host/cars/new`
- `/host/cars/[id]/edit`
- `/host/bookings`
- `/host/earnings`
- `/host/favorites`
- `/host/reviews`
- `/host/profile`
- `/hosts/[id]`
- `/contact`
- `/privacy`
- `/protection`
- `/cancellation`

## 4.2 Keep as route aliases in native linking

- `/vehicle-details/[id]` -> open native Car Detail (`/cars/[id]`).
- `/dashboard/cars` -> route by role to Host Cars or Become Host.
- `/dashboard/cars/new` -> route by role to Host New Car or Become Host.
- `/dashboard/cars/[id]/edit` -> route by role to Host Edit Car or Become Host.
- `/dashboard/earnings` -> route by role to Host Earnings or Become Host.
- `/dashboard/reviews` -> route by role to Host Reviews or Become Host.

## 4.3 SEO/marketing pages (optional native, usually web-only)

- `/airport-car-rental-accra`
- `/cheap-car-rental-ghana`
- `/list-your-car-ghana`
- `/peer-to-peer-car-rental-ghana`
- `/rent-a-car-accra`
- `/suv-rental-ghana`
- `/prices` (flagged off)
- `/blog` (flagged off)

Recommendation: keep these as web pages and open in in-app browser when needed.

## 4.4 Admin pages (recommended web-only first)

- `/admin`
- `/admin/platform`
- `/admin/messages`
- `/admin/filters`
- `/admin/users/[id]`
- `/admin/cars/[id]/preview`
- `/admin/cars/[id]/edit`

## 5) Screen-by-screen PRD (native)

## 5.1 Auth and account

### Login

- Route parity: `/auth/login`
- Purpose: sign in existing users.
- Inputs: email, password, show/hide password.
- Success: navigate to Home.
- Failure: inline error.

### Signup

- Route parity: `/auth/signup`
- Purpose: create account.
- Inputs: first name, last name, email, password, region, city, optional avatar.
- Actions: upload avatar to Supabase Storage, call profile upsert endpoint.
- Success: show verification guidance, navigate to login.

### Profile

- Route parity: `/dashboard/profile`, `/host/profile`
- Purpose: manage name, username, phone, city, avatar.
- Actions: update profile fields and avatar.

## 5.2 Discovery and booking

### Home

- Route parity: `/`
- Purpose: entry, search CTA, featured cars, trust signals.
- Actions: quick search to Explore.

### Explore

- Route parity: `/explore`
- Purpose: list cars with filters and sorting.
- Filters: region/city, car type, brand/model, fuel, transmission, seats, year, price, instant book, delivery, AC, rating, host type.
- Actions: open listing, favorite listing.

### Car Detail

- Route parity: `/cars/[id]`
- Purpose: gallery, details, host trust, availability, booking widget, messaging, reviews.
- Actions: favorite, choose dates, set trip-use location, place booking hold, pay via Paystack, start chat, submit review when eligible.

### Favorites

- Route parity: `/dashboard/favorites` (and host variant `/host/favorites`)
- Purpose: saved listings and host save analytics.

### Trips / Bookings

- Route parity: `/dashboard/bookings` and `/host/bookings`
- Guest actions: view trip status, message host, open dispute.
- Host actions: approve/reject awaiting_host bookings, message guest.

### Messages

- Route parity: `/messages`
- Purpose: conversation list + thread view.
- Actions: open conversation, send message, unread badge handling, deep link support (`?conversation=`).

### Reviews

- Route parity: listing-level review form + host reviews page `/host/reviews`
- Rules: only completed trips can be reviewed; one review per booking per user.

## 5.3 Host lifecycle

### Become Host

- Route parity: `/become-host`
- Inputs: personal info, location, ID type/number, ID front/back uploads, experience, fleet size, note.
- States: pending, approved, rejected.

### Host Dashboard

- Route parity: `/host`
- Purpose: KPIs, urgent awaiting_host bookings, conversion/performance snapshots.

### Host Cars

- Route parity: `/host/cars`
- Purpose: inventory list with approval status, availability status, favorite counts.
- Actions: create, edit, delete listing.

### Create/Edit Car

- Route parity: `/host/cars/new`, `/host/cars/[id]/edit`
- Fields: brand/model/year, generated title, location, price, type, transmission, fuel, seats, features, instant book, delivery settings, fees, cancellation policy, description.
- Photo rules: 5+ recommended, max 7, max 4MB each.
- Availability management: add blocked windows and recurring day blocks.

### Host Earnings

- Route parity: `/host/earnings`
- Purpose: payout trend, payout history, stats.

## 5.4 Trust/legal/support screens

- Contact: `/contact`
- Privacy: `/privacy`
- Protection info: `/protection`
- Cancellation policy: `/cancellation`
- Public host profile: `/hosts/[id]`

## 6) API mapping for native app

## 6.1 Core app endpoints

### Cars and discovery

- `GET /api/cars`: listing feed with filters/sort + capability metadata.
- `GET /api/cars/[id]`: single listing.
- `POST /api/cars`: create listing (host only).
- `PUT /api/cars/[id]`: update listing (host/admin).
- `DELETE /api/cars/[id]`: delete listing (host/admin).
- `POST /api/cars/[id]/photos`: upload/replace photo.
- `DELETE /api/cars/[id]/photos`: delete photo.
- `POST /api/listing-views`: track listing impressions.
- `GET /api/availability`: blocked dates and availability status.
- `POST /api/availability`: set host availability blocks.
- `GET /api/car-catalog`: make/model catalog.
- `GET /api/locations`: region/city catalog.

### Favorites

- `GET /api/favorites`: current user's favorites.
- `POST /api/favorites`: toggle favorite.

### Conversations and messages

- `POST /api/conversations`: create/find conversation.
- `POST /api/messages`: send message.

### Bookings and payments

- `GET /api/bookings`: guest + host booking lists with roles.
- `POST /api/bookings/hold`: reserve date window before payment.
- `POST /api/bookings/paystack`: verify payment and finalize booking.
- `PATCH /api/bookings/[id]`: host approve/reject awaiting_host booking.
- `POST /api/bookings`: intentionally disabled for direct booking.

### Reviews and disputes

- `POST /api/reviews`: submit review for completed trip.
- `GET /api/disputes`: list disputes linked to current user bookings.
- `POST /api/disputes`: open dispute.

### Host onboarding and status

- `GET /api/host-applications`: get latest application.
- `POST /api/host-applications`: submit application.
- `GET /api/host-applications/[id]/files?type=front|back`: secure file access.
- `GET /api/host-status`: read host status.
- `POST /api/host-activate`: activation gate for approved hosts.

### Profile bootstrapping

- `POST /api/profiles/upsert`: create/update user profile after signup.

## 6.2 Optional admin endpoints

- `GET/POST /api/admin/messages`
- `GET/POST/PATCH/DELETE /api/admin/car-makes`
- `GET/POST/PATCH/DELETE /api/admin/car-models`

## 7) Critical backend requirement for native

Current API routes use browser cookie sessions (`createSupabaseServerClient` with cookies). Native apps do not automatically send these web cookies.

Before native production, add one of these patterns:

- Preferred: bearer-token auth support on API routes (read `Authorization: Bearer <jwt>` and validate against Supabase).
- Alternative: create dedicated mobile API/Edge Functions with token auth.

Without this, many routes will return unauthorized from native clients.

## 8) Recommended technical stack

- App framework: Expo React Native (TypeScript).
- Navigation: React Navigation (tabs + stacks + deep linking).
- Data/cache: TanStack Query.
- Auth/session: `@supabase/supabase-js` with secure token storage.
- Forms/validation: React Hook Form + Zod.
- UI primitives: custom design system + React Native Paper/Tamagui or similar.
- Realtime: Supabase Realtime for conversations.
- Notifications: Expo Notifications + push token registration.
- Payments: native Paystack integration (or hosted checkout/deep link), with backend verification still in `/api/bookings/paystack`.

## 9) MVP definition of done

- Auth works (signup/login/logout/session restore).
- User can search/filter listings and open details.
- User can favorite/unfavorite listings.
- User can book via hold -> Paystack -> booking confirmed/awaiting_host.
- User and host can message each other.
- Host can create/edit listing with photos and availability.
- Host can approve/reject booking requests.
- Booking status updates and badges are accurate.
- Core legal/support pages are reachable.

## 10) Phase plan

### Phase 0: backend readiness

- Add mobile token auth path for required API routes.
- Standardize API error format and status codes.
- Add monitoring for booking/payment/message failures.

### Phase 1: renter MVP

- Auth, Home, Explore, Car Detail, Favorites, Messages, Bookings, Profile, legal/support.

### Phase 2: host parity

- Become Host, Host Dashboard, Cars CRUD, availability, host bookings, host earnings, host reviews.

### Phase 3: admin and growth

- Optional admin native tools, push notification campaigns, analytics funnels, SEO page in-app webviews.

## 11) Risks and controls

- Auth mismatch (web cookie vs native token): resolve in Phase 0 before client build-out.
- Payment edge cases: keep server-side verification as source of truth; enforce idempotency.
- Messaging consistency: retain realtime subscription + periodic sync fallback.
- Photo upload reliability on mobile networks: keep size checks (4MB) and retry UX.

## 12) Immediate next build tasks

1. Implement token-auth middleware for all mobile-required API endpoints.
2. Scaffold Expo app with route structure matching sections 5.1-5.3.
3. Build renter flow end-to-end first (search -> booking -> messages).
4. Add host flow next (onboarding -> listing -> booking actions).
5. Run pilot with internal users before App Store/Play release.
