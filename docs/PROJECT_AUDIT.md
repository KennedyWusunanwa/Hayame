# Hayame 2.0 Project Audit

Snapshot of how the app is structured, how it works, and how to run it.

## Stack & Tooling
- Next.js 16 (App Router) + TypeScript, Tailwind/shadcn-style UI primitives.
- Supabase Auth/Postgres/Storage with RLS; SSR/browser clients in `src/lib/supabase`.
- Forms/validation: react-hook-form + zod; charts: Recharts; icons: lucide.
- Scripts: `npm run dev/build/start/lint/typecheck/db:seed`.

## Environment
- Copy `.env.example` → `.env.local` and set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` (default `car-photos`), `SUPABASE_SERVICE_ROLE_KEY` (seed only), `SUPABASE_STORAGE_BUCKET`.
- Remote images allowed from Unsplash/Pexels (`next.config.ts`).

## Data & Supabase
- Schema/RLS: `db/migration.sql`; favorites policy patch in `db/patch_favorites_owner_select.sql`.
- Bucket `car-photos` (public read, owner write); tables: profiles, locations, cars, car_photos, favorites, bookings, car_availability, reviews; enum `booking_status`.
- Generated types: `src/lib/database.types.ts`; validators: `src/lib/validators.ts`.
- Seed: `db/seed.ts` (service role key required) creates hosts/guest, locations, cars/photos from `mock-data`, sample booking.

## App Behavior (Routes)
- Layout: `src/app/layout.tsx` adds `Navbar` + `Footer`; globals in `src/app/globals.css`.
- Marketing: `src/app/(marketing)/*` hero/search, featured cars (Supabase with mock fallback), how-it-works, prices/blog/contact static content.
- Explore: `src/app/explore/page.tsx` client filters (query/location/type/price/features), map placeholder (`components/map/map-panel`), favorites toggle via `/api/favorites`, cars fetched from `/api/cars`.
- Car detail: `src/app/cars/[id]/page.tsx` loads car via Supabase REST → server client → internal API → mock; shows gallery, details, features, reviews stub, availability summary, favorite toggle, booking widget posting to `/api/bookings`.
- Auth: `src/app/auth/login|signup/page.tsx` email/password Supabase browser client.
- Dashboard (guarded by `requireUser`): overview/cards; cars list/edit with live Supabase data + favorites count; favorites dashboard shows owner counts and user saves; bookings/earnings/reviews pages currently static. `PhotoUploader` and `AvailabilityForm` exist but not yet mounted on pages.

## API Surface (Supabase-backed)
- `GET/POST /api/cars` list/create (profile upsert to satisfy FK).
- `GET/PUT/DELETE /api/cars/[id]` fetch/update/delete with owner checks.
- `POST /api/bookings` overlap/date validation, total price; `GET /api/bookings` renter + owner-visible bookings.
- `GET/POST /api/favorites` toggle favorites per user.
- `POST /api/availability` owners add availability windows.
- `POST /api/reviews` renter with completed booking can review.
- `GET /api/debug/car-fetch` Supabase REST/client diagnostics.

## Key Components & Utilities
- UI primitives in `src/components/ui/*`; domain components: `car-card`, `favorite-button`, `booking-widget`, `filters-sidebar`, `map/map-panel`, `image-gallery`, `date-range-picker`.
- Forms: `CarForm` (create/update cars), `AvailabilityForm` (not mounted), `PhotoUploader` (not mounted).
- Helpers: `src/lib/utils.ts` (currency/date/options), `feature-icons.ts`, `owner-cars.ts` for dashboard counts.

## How to Run/Check
1) `npm install`
2) Apply `db/migration.sql` to Supabase; optional `npm run db:seed` (needs service role key).
3) `npm run dev`
4) Checks: `npm run lint`, `npm run typecheck`, `npm run build`.

## Gaps / Follow-ups
- Map is a placeholder; payments stub (“Paystack coming soon”).
- Dashboard bookings/earnings/reviews use static data—wire to Supabase for production.
- Attach `PhotoUploader` and `AvailabilityForm` to car edit flow for uploads/availability management.

## Directory Overview
```
.
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── LOG-2025-12-27.md
│   ├── PROJECT_AUDIT.md  ← this file
│   └── RLS.md
├── db/
│   ├── migration.sql
│   ├── patch_favorites_owner_select.sql
│   └── seed.ts
├── public/ (assets, logo, hero, placeholders)
├── src/
│   ├── app/
│   │   ├── (marketing)/{page.tsx, prices, blog, contact}
│   │   ├── auth/{login, signup}
│   │   ├── explore/page.tsx
│   │   ├── cars/[id]/page.tsx
│   │   ├── dashboard/{layout.tsx,page.tsx,bookings,earnings,reviews,favorites,cars}
│   │   ├── api/{cars, bookings, favorites, availability, reviews, debug/car-fetch}
│   │   └── privacy/page.tsx
│   ├── components/ (navbar, footer, marketing, car-card, booking-widget, filters-sidebar, map, dashboard, ui, etc.)
│   └── lib/ (supabase clients, auth, utils, validators, mock-data, owner-cars, types)
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── README.md
```
