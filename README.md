# Hayame 2.0

Turo-style peer-to-peer car rental marketplace for Ghana. Built with Next.js (App Router), TypeScript, Tailwind + shadcn-style components, Supabase (Auth/Postgres/Storage), and ready for Vercel.

## Stack
- Next.js 16 (App Router) + TypeScript
- TailwindCSS + shadcn-inspired UI primitives
- Supabase Auth + Postgres + Storage
- Recharts for dashboard charting, lucide icons, react-hook-form + zod for validation

## Getting started
1) Install deps
   ```bash
   npm install
   ```
2) Configure environment variables
   - Copy `.env.example` to `.env.local` and fill in your Supabase project values:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` (default: `car-photos`)
     - `NEXT_PUBLIC_SUPABASE_HOST_ID_BUCKET` (default: `host-ids`)
     - `SUPABASE_SERVICE_ROLE_KEY` (server/seed only, never expose to the client)
     - `SUPABASE_STORAGE_BUCKET` (default: `car-photos`)
     - `ADMIN_USERNAME` and `ADMIN_PASSWORD` (required for /admin access)
3) Apply the database schema and RLS (from `db/migration.sql`)
   - In Supabase SQL editor or CLI: run the contents of `db/migration.sql`.
   - This creates tables, enums, RLS policies, and the `car-photos` storage bucket policies.
4) (Optional) Seed sample data
   ```bash
   npm run db:seed
   ```
   - Requires `SUPABASE_SERVICE_ROLE_KEY`. Seeds 8 cars across Accra, Kumasi, Takoradi, Tamale and creates sample host + guest accounts.
5) Run locally
   ```bash
   npm run dev
   ```
6) Build check
   ```bash
   npm run lint
   npm run typecheck
   npm run build
   ```

## Key features
- Marketing pages (Home, Prices, Blog, Contact) with hero search, featured vehicles, and map placeholder.
- Explore page with filters sidebar + mobile drawer, map panel adapter, and car cards with favorites.
- Car detail page with gallery, host info, availability picker, booking widget (Paystack stub).
- Auth: email/password login & signup using Supabase.
- Dashboards (protected): user dashboard for renters + host dashboard for approved hosts.
- Supabase integration: typed client helpers, secure route handlers for cars, bookings, favorites, reviews.
- Database + RLS: public car browsing, owner-only writes, renter/owner booking visibility, review restrictions, storage bucket policies.

## Project structure (high level)
- `src/app/(marketing)/*` — marketing pages
- `src/app/auth/*` — login & signup
- `src/app/explore`, `src/app/cars/[id]` — search & detail
- `src/app/dashboard/*` — protected user dashboard
- `src/app/host/*` — protected host dashboard
- `src/app/become-host` — host application page
- `src/app/admin` — admin approvals (env-protected)
- `src/app/api/*` — server route handlers for CRUD + booking/favorites/reviews
- `src/components` — UI primitives, layout, dashboard widgets, map placeholder, forms
- `src/lib` — supabase clients, types, validators, utils, mock data
- `db/migration.sql` — schema + RLS + storage bucket
- `db/seed.ts` — seed script using Supabase service role key
- `docs/*` — architecture, RLS, deployment guides

## Supabase notes
- Auth: email/password via `@supabase/ssr` clients. `requireUser` guards dashboard routes.
- Storage: bucket `car-photos` with public read and owner write policies (object owner must equal `auth.uid()`).
- RLS is strict—server operations run as the user session (anon key) and rely on policies for safety. Service role key is only used by the seed script.

## Deployment
- Set the same env vars on Vercel (NEXT_PUBLIC_SUPABASE_URL / ANON key; optional SERVICE_ROLE for CI scripts only).
- Run `npm run build` during deployment.
- For Supabase: run `db/migration.sql` once, configure the `car-photos` bucket (created by migration). See `docs/DEPLOYMENT.md` for more.

## Testing reminders
- `npm run lint` – ESLint/Next rules
- `npm run typecheck` – TypeScript
- `npm run build` – production build check
# Hayame
