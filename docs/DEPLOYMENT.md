# Deployment (Vercel + Supabase)

## Supabase setup

1. Create a new Supabase project.
2. Run `db/migration.sql` in the SQL editor (creates tables, enums, RLS, storage bucket + policies).
3. Run the incremental SQL files in `db/` that apply to the launch build, including `db/platform_audit_activation.sql`, `db/mobile_booking_delivery.sql`, `db/mobile_push_tokens.sql`, `db/notifications_announcements.sql`, and `db/launch_performance_indexes.sql`.
4. In **Storage**, confirm bucket `car-photos` exists (migration creates it). Leave it public and keep RLS policies applied.
5. (Optional) Seed sample data locally with `npm run db:seed` (requires `SUPABASE_SERVICE_ROLE_KEY`). This creates demo hosts/guest and 8 cars.

## Environment variables (Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` (default `car-photos`)
- `SUPABASE_SERVICE_ROLE_KEY` (only if running seed/CLI tasks in CI, never exposed to the client)
- `SUPABASE_STORAGE_BUCKET=car-photos`
- `PAYSTACK_SECRET_KEY`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_AUTH_CONFIRMATION_REDIRECT_URL`
- `RESEND_API_KEY` and `RESEND_FROM` (e.g. `Hayame <no-reply@hayamegh.com>`) for all transactional email
- `ADMIN_NOTIFICATIONS_EMAIL` (comma separated) for internal notices: new host applications, vehicle submissions and edits, paid bookings, disputes and platform fee changes. Falls back to `SUPPORT_INBOX_EMAIL`. Important and critical admin actions are also emailed to every active admin account (see below).
- `SUPPORT_INBOX_EMAIL` for contact form requests and the reply-to address on every email
- `EMAIL_LOGO_URL` (optional) absolute URL of the white wordmark for email headers; defaults to `<NEXT_PUBLIC_SITE_URL>/logo-white.png`
- `NEXT_PUBLIC_IOS_APP_STORE_URL`, `NEXT_PUBLIC_ANDROID_PLAY_STORE_URL` (leave unset until listed) and `NEXT_PUBLIC_ANDROID_APK_URL` for the app links shown on the site and in email footers
- Push delivery variables for enabled platforms: `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY`, `APNS_TOPIC`, and Firebase HTTP v1 credentials or `FCM_SERVER_KEY`

## Build & deploy

1. Push to your repo; connect Vercel to the repo.
2. Set the env vars above in the Vercel project.
3. Vercel build command: `npm run build` (defaults are fine). Output is the Next.js build.
4. After first deploy, verify:
   - Auth endpoints: `/auth/login`, `/auth/signup`.
   - API routes: `/api/cars`, `/api/bookings` return JSON (401 if unauthenticated).
   - Images load from `images.unsplash.com` (allowed in `next.config.ts`).

## Post-deploy checks

- Create a test account via signup, list a car from `/dashboard/cars/new`, upload photos to `car-photos` bucket (public read, owner write).
- Create a booking from a second account to verify booking policies and ensure car owner can see it on `/dashboard/bookings`.
- Favorites: toggle heart on Explore; confirm rows in `favorites` for the signed-in user.

## Payments

- Booking uses the hold -> Paystack initialize -> Paystack verify/finalize flow. Verify a real low-value Paystack transaction in the launch environment before opening traffic.
- Native iOS and Android payments do not store Paystack keys. They open checkout URLs returned by the backend, so production mobile payments use live mode when the deployed backend has a live `PAYSTACK_SECRET_KEY`.
- Host rejection triggers the Paystack refund path for paid Paystack bookings. Confirm `PAYSTACK_SECRET_KEY` has refund permissions in the production Paystack account.

## Admin accounts, roles and audit log

1. Run `db/admin_roles_audit.sql` once in the Supabase SQL editor (creates `admin_users`, adds who/where/severity columns to `admin_actions`, and makes the log append-only).
2. The `ADMIN_USERNAME` / `ADMIN_PASSWORD(_HASH)` credentials stay valid as the **root super admin** so nobody can be locked out. Sign in with that, open **Team & roles**, and create a personal account for each person.
3. Roles: Super admin (everything), Admin (operations), Support (messages, disputes, reviews, errors), Finance (refunds, disputes, analytics). The matrix lives in `src/lib/admin-permissions.ts` and is shown on the Team page.
4. New accounts get a temporary password (shown once to the creator) and must choose their own on first sign-in. Five wrong passwords lock an account for 15 minutes.
5. Every sensitive action is written to the audit log. Important and critical ones email all active admins plus `ADMIN_NOTIFICATIONS_EMAIL`. Severity per action is set in `src/lib/admin-actions-catalog.ts`.
6. Run `db/site_maintenance.sql` too if you use maintenance mode.
