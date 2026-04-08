# TECH_STACK

## Frontend (web)

- Framework: Next.js 16.1.1 (App Router, React Server Components + client components)
- Language: TypeScript
- UI system:
  - Tailwind CSS
  - shadcn-style UI primitives (Radix-based components)
  - Lucide icons
- Forms and validation: `react-hook-form` + `zod`
- Charts: `recharts`
- Key UX modules: explore filters, booking widget, messaging UI, host/admin dashboards

## Backend/API architecture

- Runtime model: Next.js Route Handlers in `src/app/api/**/route.ts`
- Pattern:
  - Route handlers for all domain operations (cars, bookings, reviews, disputes, messaging, admin)
  - Server actions used in admin pages for moderation controls
- Auth-aware request access:
  - Cookie-based SSR session support
  - Bearer token support via `getRequestUser` fallback (important for mobile)
- Data access style:
  - Supabase SSR client for user-context operations
  - Supabase admin client (service role) for privileged/admin operations

## Database (Supabase/Postgres)

- Primary store: Supabase Postgres
- Schema source in repo:
  - `db/migration.sql`
  - `db/platform_audit_activation.sql`
  - `db/mobile_push_tokens.sql`
- Key entities in migrations:
  - `profiles`, `host_applications`, `admin_actions`, `locations`, `cars`, `car_photos`, `favorites`, `bookings`, `car_availability`, `reviews`, `platform_settings`, `listing_views`, `disputes`, `mobile_push_tokens`
- View:
  - `car_search_view` for enriched listing search payloads
- Row-level security:
  - RLS enabled across core tables with ownership/participant-based policies

## Authentication and session model

- Provider: Supabase Auth (email/password)
- Web sessions:
  - `@supabase/ssr` server/browser clients
  - cookie-backed auth for web flows
- Token support:
  - Bearer JWT accepted in request headers on API paths using `getRequestUser`
- Mobile auth routes:
  - `/api/mobile/auth/login|signup|refresh|forgot-password|resend-confirmation`
  - `/api/mobile/me` for bearer-token user bootstrap

## Payments

- Active provider: Paystack only
- Implemented capabilities:
  - Initialize transaction
  - Verify transaction
  - Refund transaction
- Integration points:
  - Web booking widget + `/api/bookings/paystack`
  - Mobile wrappers `/api/mobile/bookings/paystack/initiate` and `/finalize`
- Not found: Stripe/Flutterwave/PayPal integrations

## Infrastructure and deployment

- Web hosting target: Vercel (per docs and env model)
- Backend/data/auth/storage: Supabase
- Storage buckets:
  - `car-photos` (public read)
  - `host-ids` (private, signed URL access)
- CDN/images:
  - Next.js image remote patterns for Unsplash, Pexels, Supabase public object URLs
- Email infrastructure:
  - Resend (`RESEND_API_KEY`, `RESEND_FROM`)

## Mobile stack

- iOS app repo found: `HayameIOS`
- Stack:
  - Native SwiftUI app (iOS 17+)
  - Xcode project generated via `project.yml`
  - URL scheme support for deep links (`hayameios`)
- Mobile integration pattern:
  - Uses Hayame API routes directly (including `/api/mobile/*`)
  - Includes extensive fallback calls to Supabase REST/Auth in `APIClient.swift`
- Android:
  - No dedicated Android repo found in current workspace
- Capacitor/React Native:
  - Not used for current iOS implementation

## Observability/analytics tooling (technical)

- Product metrics stored in-app tables (`listing_views`, bookings/reviews aggregates)
- No dedicated third-party analytics SDK detected (e.g., PostHog, Mixpanel, Segment)
- No Sentry/Datadog class instrumentation found in scanned repos
