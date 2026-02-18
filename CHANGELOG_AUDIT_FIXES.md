# Platform Audit Fixes Changelog

## Search & Discovery
- Implemented:
  - URL query params are the single source of truth for Explore filters and sort.
  - Smart filters wired end-to-end: price range, instant book, delivery, transmission, fuel, seats, year, air conditioning, rating, host type, features.
  - Server-side filter/sort support in `src/app/api/cars/route.ts` via `car_search_view`.
  - Sort options enabled: `price_low`, `price_high`, `most_booked`, `top_rated`, `new_listings`.
  - Availability preview checker remains active on vehicle detail (`src/components/availability-preview.tsx`).
  - Listing approval gating applied so only approved listings appear publicly.
- Placeholder/TODO due schema:
  - None after running `db/platform_audit_activation.sql`.

## Trust & Safety
- Implemented:
  - Verification badges now use real flags (`id_verified`, `phone_verified`, `email_verified`).
  - Badges applied in host snippet, booking box, host profile, and host dashboard.
  - Added and linked `/protection` page from footer, trust strip, and booking box.
  - Homepage trust/metrics section shows real aggregates when available with safe fallback messaging.
  - Host approval flow updates profile verification and host level metadata.
- Placeholder/TODO due schema:
  - Protection coverage copy is informational by design (no fake insurance/support claims).

## Host Improvements
- Implemented:
  - Interactive earnings calculator on `/host` using configurable platform fee.
  - Host performance dashboard now includes real views, conversion rate, earnings, booking rate, reviews, and trip history.
  - Host level badges now map from explicit `profiles.host_level` (with computed fallback).
  - Listing view tracking added via `/api/listing-views` + `listing_views` table.
- Placeholder/TODO due schema:
  - None after running `db/platform_audit_activation.sql`.

## Listing Quality
- Implemented:
  - Listing submission enforces minimum 5 photos in client validation.
  - Listing quality checklist UI added in car form.
  - New fields added to listing form and persistence:
    - `car_year`
    - `delivery_available`
    - `air_conditioning`
    - `delivery_fee`
    - `insurance_fee`
    - `deposit_amount`
    - `cancellation_policy`
  - Feature selection (Bluetooth, Reverse Camera, Leather Seats, Sunroof, GPS, Apple CarPlay, Android Auto) is saved and rendered.
  - New and edited listings now flow through admin approval.
- Placeholder/TODO due schema:
  - Plate blur automation is still labeled "Coming soon" (feature not implemented in current codebase).

## Booking Experience
- Implemented:
  - Booking breakdown now charges and displays:
    - daily rate
    - days
    - platform fee
    - insurance fee
    - delivery fee
    - deposit
    - total
  - Paystack verification now validates against full charged total and stores fee breakdown columns on bookings.
  - Cancellation policy is now listing-backed (`flexible` / `moderate` / `strict`) and shown in booking flow + dashboard table.
  - Trip status tracker remains active and mapped to booking statuses.
  - Disputes flow implemented:
    - open dispute from renter bookings
    - `/api/disputes` with ownership checks and duplicate-open protection
    - admin resolution workflow in `/admin/platform`
- Placeholder/TODO due schema:
  - None after running `db/platform_audit_activation.sql`.

## SEO Pages
- Implemented:
  - Added content pages with metadata, FAQ, and internal links:
    - `/rent-a-car-accra`
    - `/cheap-car-rental-ghana`
    - `/suv-rental-ghana`
    - `/airport-car-rental-accra`
    - `/list-your-car-ghana`
    - `/peer-to-peer-car-rental-ghana`
  - Shared reusable template in `src/components/seo/landing-template.tsx`.
- Placeholder/TODO due schema:
  - None.

## Admin Placeholders
- Implemented:
  - Added fully functional admin controls route: `/admin/platform`.
  - Listing approvals:
    - approve/reject pending listings
    - write moderation status/reviewer/reason fields
  - Refund control:
    - refund paid bookings (including Paystack refund call when available)
  - Review moderation:
    - hide/unhide reviews with reasons and moderation metadata
  - Disputes:
    - status workflow (`open`, `under_review`, `resolved`, `closed`)
    - resolution note updates
  - Added admin action audit entries for listing review, refunds, review moderation, and dispute updates.
  - Added quick navigation to platform controls from `/admin`.
- Placeholder/TODO due schema:
  - None after running `db/platform_audit_activation.sql`.

## Activation SQL
- Supabase migration file added:
  - `db/platform_audit_activation.sql`
- This migration provisions all required schema objects for the new functionality:
  - new columns and constraints
  - `platform_settings`, `listing_views`, `disputes` tables
  - `car_search_view` view
  - RLS policies and grants
