# Architecture

## Overview
- **Framework**: Next.js App Router + TypeScript, TailwindCSS, shadcn-style UI components.
- **Backend**: Supabase (Auth + Postgres + Storage). All server-side mutations happen through route handlers with Supabase SSR clients and RLS enforcement.
- **Hosting**: Vercel for the web app; Supabase for data/auth/storage.

## App layout
- `src/app/layout.tsx` wraps pages with Navbar + Footer.
- Route groups:
  - `/(marketing)` → Home, Prices, Blog, Contact.
  - `/auth` → Login/Signup.
  - `/explore`, `/cars/[id]` → Search and detail flows.
  - `/dashboard` → Protected host dashboard (overview, cars CRUD, bookings, earnings, reviews).
  - `/api/*` → Route handlers for cars, bookings, favorites, reviews.

## Components
- UI primitives in `src/components/ui/*` (button, card, inputs, badges, table, sheet, etc).
- Domain components:
  - `navbar`, `footer`, `car-card`, `filters-sidebar`, `map/map-panel` (adapter-based placeholder), `date-range-picker`, `booking-widget`, `image-gallery`.
  - Dashboard widgets: `dashboard/sidebar`, `dashboard/stat-card`, `dashboard/earnings-chart`.
  - Forms: `car-form` (create/update cars with react-hook-form + zod).

## Data + domain models
- Schema defined in `db/migration.sql` (see `docs/RLS.md` for policies).
- Core tables: `profiles`, `locations`, `cars`, `car_photos`, `favorites`, `bookings`, `car_availability`, `reviews`.
- Enum: `booking_status` (`pending | confirmed | cancelled | completed`).
- Storage bucket: `car-photos` (public read, owner write).
- Type mappings: `src/lib/database.types.ts` (Supabase generated types), `src/lib/types.ts` (lightweight UI-facing types), validators in `src/lib/validators.ts`.

## Supabase integration
- SSR client: `src/lib/supabase/server.ts` using `@supabase/ssr` with cookie persistence.
- Client-side auth: `src/lib/supabase/client.ts` for login/signup.
- Auth guard: `src/lib/auth.ts` (`requireUser` redirects to `/auth/login`). Dashboard layout sets `dynamic = "force-dynamic"`.
- API routes use the SSR client (anon key) so RLS protects writes/reads.

## Flows
- **Marketing**: static content plus featured cars rendered from `mockCars` fallback data for design parity.
- **Explore**: client page with filter state, map placeholder adapter, favorites toggle via `/api/favorites` (supabase-backed when authenticated).
- **Car detail**: renders gallery, host info, features, booking widget posts to `/api/bookings` (server-side validation of overlap + total price), Paystack stub message.
- **Dashboard**:
  - Overview: stat cards + `recharts` earnings area chart + bookings table.
  - Cars: list + new/edit pages using `CarForm` POST/PUT to `/api/cars`.
  - Bookings/Earnings/Reviews: tabular views with sample data; wired endpoints ready for Supabase data.

## API surface
- `POST /api/cars` – create car (owner only).
- `GET/PUT/DELETE /api/cars/[id]` – fetch/update/delete car with owner checks.
- `POST /api/bookings` – create booking with overlap check and computed total.
- `GET /api/bookings` – bookings visible to renter or owners of the car.
- `GET/POST /api/favorites` – list or toggle favorites for the current user.
- `POST /api/reviews` – renter with completed booking can review.

## Mock data
- `src/lib/mock-data.ts` holds 8 Ghana-based cars used for marketing/demo rendering and seeding. Real data flows rely on Supabase once configured.
