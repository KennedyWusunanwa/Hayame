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
- `RESEND_API_KEY` and sender/support email variables if email notifications are enabled
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
