# Deployment (Vercel + Supabase)

## Supabase setup

1. Create a new Supabase project.
2. Run `db/migration.sql` in the SQL editor (creates tables, enums, RLS, storage bucket + policies).
3. In **Storage**, confirm bucket `car-photos` exists (migration creates it). Leave it public and keep RLS policies applied.
4. (Optional) Seed sample data locally with `npm run db:seed` (requires `SUPABASE_SERVICE_ROLE_KEY`). This creates demo hosts/guest and 8 cars.

## Environment variables (Vercel)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` (default `car-photos`)
- `SUPABASE_SERVICE_ROLE_KEY` (only if running seed/CLI tasks in CI, never exposed to the client)
- `SUPABASE_STORAGE_BUCKET=car-photos`

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

## Payments placeholder

- The booking widget displays “Pay later / Paystack coming soon.” Future Paystack integration can hook into `/api/bookings` for payment intents and status updates without changing UI flows.

Supbase pass: @Sas0907611706698
