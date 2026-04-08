# Hayame 2.0 Audit (2025-12-27)

What the project does, how it is wired, and current risk notes.

## Stack & Runtime

- Next.js 16 (App Router, RSC) + TypeScript; Tailwind + shadcn-style UI.
- Supabase (Postgres/Auth/Storage) with SSR client in `src/lib/supabase/server.ts` and browser client in `src/lib/supabase/client.ts`.
- Forms: react-hook-form + zod; charts: Recharts; icons: lucide-react.
- Scripts: `npm run dev`, `build`, `start`, `lint`, `typecheck`, `db:seed` (needs service role key).

## Data & APIs

- Schema/RLS in `db/migration.sql`; favorites select policy patch in `db/patch_favorites_owner_select.sql`.
- Tables used in app: profiles, cars, car_photos, favorites, bookings, car_availability, reviews; bucket `car-photos` for images.
- Core API routes:
  - `GET/POST /api/cars`, `GET/PUT/DELETE /api/cars/[id]`
  - `POST /api/bookings`
  - `POST /api/favorites`
  - `POST /api/availability`
  - `POST /api/reviews`
  - `GET /api/debug/car-fetch` (diagnostics)

## App Behavior

- Marketing pages under `src/app/(marketing)`; navbar/footer in root layout.
- Explore page (`/explore`) lists cars with filters, map placeholder, favorites toggle.
- Car detail (`/cars/[id]`) now fetches via internal API first (relative), falls back to env origin, validates UUID, and only shows "Car not found" on true 404/invalid id. Legacy `/vehicle-details/[id]` redirects here.
- Dashboard pages for overview, cars CRUD, favorites counts, bookings/earnings/reviews (some data static).
- Auth pages for login/signup via Supabase.

## Findings about the "Car not found" bug

- Root cause: previous loader built `apiBase` using `await headers()` inside a non-async closure and swallowed fetch errors, so production SSR failed and returned null, triggering the "Car not found" UI.
- Fix applied: deterministic loader that hits `/api/cars/[id]` via relative fetch (no host guessing), UUID guard, explicit error logging, and fallback to env origin (`NEXT_PUBLIC_SITE_URL` -> `https://${VERCEL_URL}` -> `http://localhost:3000`). Vehicle-details route now redirects to `/cars/[id]`.
- Validation: `npm run typecheck` and `npm run build` succeed locally after the fix.

## How to run/check

1. `npm install`
2. Create `.env.local` from `.env.example` with Supabase URL/anon key, bucket names, optional `NEXT_PUBLIC_SITE_URL`.
3. `npm run dev`
4. Sanity checks: `npm run lint`, `npm run typecheck`, `npm run build`.

## Directory overview

```
.
|- docs/ (ARCHITECTURE.md, DEPLOYMENT.md, LOG-2025-12-27.md, PROJECT_AUDIT.md, RLS.md)
|- db/ (migration.sql, patch_favorites_owner_select.sql, seed.ts)
|- public/ (logo/assets, car-placeholder.jpg)
|- src/
|  |- app/
|  |  |- (marketing)/{page.tsx, blog, contact, prices}
|  |  |- api/{cars, bookings, favorites, availability, reviews, debug/car-fetch, vehicle-details/[id]}
|  |  |- auth/{login, signup}
|  |  |- cars/[id]/page.tsx (car detail)
|  |  |- vehicle-details/[id]/page.tsx (redirects to cars page)
|  |  |- explore/page.tsx
|  |  |- dashboard/{layout.tsx, page.tsx, cars, bookings, earnings, favorites, reviews}
|  |  |- privacy/page.tsx
|  |- components/ (ui primitives, navbar/footer, car-card, favorite-button, booking-widget, filters-sidebar, image-gallery, map, dashboard widgets)
|  |- lib/ (supabase clients, utils, validators, feature-icons, database.types, mock-data, owner-cars)
|- package.json, tailwind.config.ts, next.config.ts, tsconfig.json
```
