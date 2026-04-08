# Android Native Parity Audit (Hayame)

Date: 2026-03-19
Repo audited: `/Users/profdouglas/Desktop/Hayame 2.0`
Goal: Build a native Android app for Play Store with full feature parity to current iOS app, with modern Android UX.

## 1) Executive summary

Readiness status: **medium** (foundation is strong, but there are production blockers).

What is already strong:

- Mature iOS product surface (renter + host + legal/support + profile + payments + messaging).
- Backend API coverage for mobile auth, listing, booking, payments, messaging, host lifecycle.
- Refund flows exist (host rejection and admin refund).
- Push token storage table exists and push events are triggered for bookings/messages/host-application decisions.

What blocks full Android parity today:

- Push delivery backend is iOS/APNs-only and explicitly filters tokens to `platform = ios`.
- Notification behavior in iOS relies heavily on local notifications from polling, which explains "works when app is open" behavior.
- Database migration source-of-truth is incomplete in repo for core runtime messaging tables (`conversations`, `messages`).
- Schema/type drift exists (`database.types.ts` does not include some tables used by runtime routes).

Conclusion:

- Android parity is feasible with current backend, but only after a short backend hardening phase (push + schema/migrations + observability + consistency).

## 2) Current product surface to match on Android

### Auth and session

- Email/password login, signup, resend confirmation, forgot password, refresh token.
- Guest mode.
- Session restore and refresh.

### Renter flows

- Home and Explore with full filtering/sorting.
- Car details, gallery, host trust signals, availability preview.
- Booking hold + Paystack checkout + finalize.
- Trips list (status, payment info, rejection reason, disputes).
- Favorites.
- Inbox + chat threads.
- Profile edit and avatar upload.

### Host flows

- Host mode switch + host approval states.
- Host dashboard.
- Listing CRUD, photos, availability windows + recurring blocks.
- Booking approval/rejection.
- Earnings dashboard.
- Host reviews and host profile.

### Shared/support

- Privacy, protection, cancellation, contact pages.
- Become host form and identity document upload.

### Admin-related note

- iOS includes admin screen components, but current app shell does not route into an admin shell directly.
- Admin remains web-led in this repository.

## 3) Parity matrix (Android build scope)

### A) Must match 1:1 (functional parity)

- Auth/session lifecycle.
- Explore/filter/sort and listing detail.
- Booking and payment flow.
- Messaging and unread logic.
- Favorites.
- Host lifecycle and listing management.
- Availability editor.
- Booking decisioning and refunds.
- Legal/support screens.

### B) Must match but with Android-native UX

- Material 3 navigation patterns.
- Android-native pickers, sheets, form controls, haptics, typography, and motion.
- App links/deep links and notification navigation.

### C) Recommended for release quality

- Offline-friendly caching for read flows.
- Retry/queue for message sends and uploads on unstable network.
- Better observability on payment/push/messaging failures.

## 4) Backend/API audit for Android parity

### Ready endpoints (usable)

- Mobile auth: `/api/mobile/auth/*`, `/api/mobile/me`.
- Cars/catalog/locations/availability/favorites/bookings.
- Mobile booking payment initiate/finalize aliases.
- Conversations/messages.
- Host status/applications/profile upsert.
- Reviews/disputes.

### Critical backend gaps to fix before Android rollout

1. Push transport supports only APNs/iOS.

- `src/lib/push.ts` builds APNs JWT and queries only iOS tokens.
- No FCM sender path exists.

2. Push status endpoint is APNs-centric.

- `/api/mobile/push/status` reports APNs config and iOS token count only.

3. Event coverage for remote push is incomplete for closed-app parity.

- Messaging and booking events send push.
- Host/listing moderation and some admin actions are inconsistent depending on admin path used.

4. Schema migration completeness gap.

- Runtime routes use `conversations` and `messages`, but checked-in SQL migrations do not create them.
- This risks broken new environments and CI/preview deployments.

5. Type/schema drift.

- `src/lib/database.types.ts` lacks several runtime-used tables (for example conversations/messages/mobile push table), increasing regression risk.

## 5) Push/notification audit (root cause of "only works when app is open")

Root causes found:

- iOS app schedules local notifications based on polling deltas in app state.
- Those local notifications can only happen while app process is active.
- Remote push infrastructure is APNs-only and can be skipped if APNs env/config is incomplete.
- Therefore users observe notifications primarily when app is open.

For Android parity and closed-app behavior:

- Implement FCM token registration and FCM send path.
- Keep APNs + FCM side-by-side by platform.
- Ensure every user-facing event that currently relies on local polling also emits remote push from backend.

Minimum event set for remote push:

- New message.
- New booking request.
- Booking confirmed/rejected/refunded.
- Host application approved/rejected.
- Listing moderation updates (approved/rejected) if required product behavior.

## 6) Payments/refund audit

What exists:

- Paystack initialize and verify server-side.
- Booking finalization checks amount and status.
- Host rejection path attempts Paystack refund.
- Admin refund action exists.

What to harden for Android release:

- Add standardized idempotency keys for all finalize/refund actions (some idempotent behavior exists, but not uniformly enforced as an explicit contract).
- Add metrics/log alerts on refund failures and payment mismatch incidents.
- Ensure Android deep-link callback scheme is accepted and validated in payment-init callback sanitizer.

## 7) Data/schema audit

Observed risks:

- Missing migration SQL for messaging tables used at runtime.
- Inconsistent DB type definitions vs runtime route usage.

Required actions:

1. Create canonical migration(s) for missing runtime tables and constraints:

- `conversations`
- `messages`
- supporting indexes and read/unread tracking fields
- any triggers used for last-message summary updates

2. Regenerate `database.types.ts` from actual Supabase schema after migrations.

3. Add migration CI check (fresh database apply + smoke tests).

## 8) Security/ops audit

Risks:

- Sensitive keys are visible in local env context and templates in prior audits.
- Admin authentication is simple cookie/env credentials, not robust RBAC.

Actions:

- Rotate exposed secrets before production Android rollout.
- Sanitize templates to placeholders only.
- Add real RBAC/admin claims for privileged operations over time.
- Add Sentry (or equivalent) and structured event logging for mobile + backend.

## 9) Android technical architecture recommendation

### Stack

- Kotlin + Jetpack Compose + Material 3.
- Navigation Compose.
- MVVM + unidirectional state flow.
- Hilt for DI.
- Retrofit/OkHttp + Kotlinx serialization.
- Room (cache) + DataStore (session/preferences).
- WorkManager for resilient background/retry tasks.
- FCM for notifications.

### Module plan

- `app`
- `core-ui`, `core-network`, `core-data`, `core-model`, `core-common`
- `feature-auth`
- `feature-explore`
- `feature-listing-detail`
- `feature-booking`
- `feature-inbox`
- `feature-trips`
- `feature-favorites`
- `feature-profile`
- `feature-host-*` (dashboard, cars, bookings, earnings, reviews, availability, onboarding)

### Android UX principles for "modern Android feel"

- Material 3 components and dynamic color (brand constrained).
- Bottom navigation + top app bars + large screen adaptive layouts.
- Pull-to-refresh and optimistic updates where safe.
- Native pickers for dates/media.
- Snackbar-first transient feedback, not blocking alerts for every operation.

## 10) Full implementation plan (phased)

### Phase 0: backend hardening (blocker phase)

- Add FCM pipeline and platform-aware push sender.
- Unify push event coverage for all required events.
- Add missing migrations and regenerate DB types.
- Add push/payment observability.

Exit criteria:

- Push arrives on closed iOS and Android test devices for all target event types.
- Fresh environment bootstrap succeeds with migrations only.

### Phase 1: Android foundation

- Project setup, architecture skeleton, theme/design system, auth/session bootstrap, network layer, error model.

Exit criteria:

- Login/signup/session restore works end-to-end against production-like backend.

### Phase 2: Renter parity

- Explore, listing detail, booking/payment, trips, favorites, inbox/chat, profile.

Exit criteria:

- End-to-end renter journeys pass QA matrix on real devices.

### Phase 3: Host parity

- Host onboarding + approval states, host dashboard, cars CRUD/photos/availability, booking decisions, earnings, host reviews/profile.

Exit criteria:

- Full host journey from application to listing to booking decision works.

### Phase 4: hardening + release

- Performance, accessibility, crash/perf monitoring, Play release checklist, staged rollout.

Exit criteria:

- Crash-free target met and production telemetry healthy.

## 11) QA and acceptance matrix

Must test on real Android devices (not emulator-only):

- Auth: signup/login/refresh/logout/password reset/resend confirmation.
- Search/filter/sort combinations and empty/error states.
- Booking hold conflicts, checkout success/failure/cancel callback.
- Refund paths (host reject, admin refund).
- Messaging send/receive/read/unread badges.
- Push events while app is foreground/background/terminated.
- Host application pending/approved/rejected transitions.
- Listing CRUD with photo upload/replace/delete and availability.
- Network interruption and retry behavior.

## 12) Delivery estimate (realistic)

Assuming 1 senior Android engineer + 1 backend engineer + 1 QA:

- Phase 0: 1-2 weeks
- Phase 1: 1 week
- Phase 2: 3-4 weeks
- Phase 3: 2-3 weeks
- Phase 4: 1-2 weeks

Total: ~8-12 weeks for production-grade parity.

## 13) Immediate next actions

1. Implement FCM in backend push service and add Android token registration flow.
2. Complete missing DB migrations for messaging tables and regenerate DB types.
3. Freeze API contracts for Android and publish OpenAPI or typed contract package.
4. Scaffold Android project with agreed architecture and start Phase 1.
