# Platform Audit Fixes Changelog

## Search & Discovery
- Implemented:
  - Refactored `src/app/explore/page.tsx` so URL query params are the source of truth for filters/sort.
  - Added smart filter controls in `src/components/filters-sidebar.tsx`:
    - Price range (slider + min/max inputs)
    - Instant Book
    - Delivery available
    - Transmission
    - Fuel type
    - Seats capacity
    - Car year range
    - Air conditioning
    - Rating minimum
    - Host type
  - Added `sort` query param with options:
    - Price (Low -> High)
    - Price (High -> Low)
    - Most booked
    - Top rated
    - New listings
  - Added mobile sort dropdown and schema-aware disabled options with "Coming soon" labels.
  - Added availability preview widget (`src/components/availability-preview.tsx`) to car detail page to check dates before booking.
- Placeholder/TODO due schema:
  - `delivery_available` filter requires a real `cars.delivery_available` field for full support.
  - Car year range requires `cars.year` or `cars.car_year`.
  - Host type filter requires host-level/verification schema (example: `profiles.host_level`).
  - Top rated and most booked sort rely on aggregate fields (example: `cars.avg_rating`, `cars.bookings_count`).

## Trust & Safety
- Implemented:
  - Added `src/components/verification-badges.tsx` and integrated badges in:
    - Host snippet on car detail page
    - Booking box on car detail page
    - Host profile page
    - Host dashboard overview
  - Added dedicated protection route: `src/app/protection/page.tsx`.
  - Linked protection page from:
    - Footer (`src/components/footer.tsx`)
    - Homepage trust strip (`src/components/marketing/trust-strip.tsx`)
    - Booking box (`src/components/booking-widget.tsx`)
  - Added homepage trust/metrics area:
    - Real aggregate counts when admin metrics are available (`src/components/marketing/home-metrics.tsx`)
    - Safe fallback statements when metrics cannot be loaded.
- Placeholder/TODO due schema:
  - Verification states need dedicated profile flags (example: `profiles.id_verified`, `profiles.phone_verified`, `profiles.email_verified`).
  - Protection sections are informational placeholders until policy-backed coverage is implemented.

## Host Improvements
- Implemented:
  - Added host earnings calculator component (`src/components/host/earnings-calculator.tsx`) to `/host`.
  - Updated `/host` dashboard (`src/app/host/page.tsx`) with:
    - total earnings
    - monthly earnings
    - booking rate
    - reviews
    - trip history table
    - host level badge area
    - verification badge area
  - Added "Start Earning Today" CTA on host overview.
- Placeholder/TODO due schema:
  - Views and conversion rate are UI placeholders pending schema support.
  - Host level mapping currently defaults to "New Host" without a dedicated level field.
  - Platform fee default in calculator falls back to 10% unless env config is added (`NEXT_PUBLIC_PLATFORM_FEE_PERCENT` / `PLATFORM_FEE_PERCENT`).

## Listing Quality
- Implemented:
  - Enforced minimum 5-photo validation in listing form (`src/components/car-form.tsx`).
  - Added listing quality checklist UI and "Plate blur automatically: Coming soon" note.
  - Wired existing photo counts into edit forms:
    - `src/app/host/cars/[id]/edit/page.tsx`
    - `src/app/admin/cars/[id]/edit/page.tsx`
  - Expanded feature options to include requested items (Bluetooth, Reverse Camera, Leather Seats, Sunroof, GPS, Apple CarPlay, Android Auto).
  - Added feature icon mapping for Reverse Camera.
- Placeholder/TODO due schema:
  - Server-side 5-photo enforcement is not transactional yet because photo upload is separate from car create/update request.

## Booking Experience
- Implemented:
  - Added pricing breakdown in booking widget (`src/components/booking-widget.tsx`) including:
    - daily rate
    - number of days
    - platform fee
    - insurance fee
    - delivery fee
    - deposit
    - total charged now
  - Ensured non-implemented fees are labeled "Coming soon" and not included in charged total.
  - Added cancellation placeholder link in booking widget and bookings table to `/cancellation`.
  - Added trip status tracker (`src/components/trip-status-tracker.tsx`) in bookings table.
  - Added mobile sticky "Book Now" jump button on car detail.
  - Added cancellation route: `src/app/cancellation/page.tsx`.
- Placeholder/TODO due schema:
  - Per-listing cancellation policy badge requires a dedicated policy field (example: `cars.cancellation_policy`).
  - Insurance, delivery, and deposit lines are placeholders unless backed by charged fields and checkout logic.

## SEO Pages
- Implemented:
  - Added SEO landing pages with metadata, human-readable content, FAQs, and internal links:
    - `/rent-a-car-accra`
    - `/cheap-car-rental-ghana`
    - `/suv-rental-ghana`
    - `/airport-car-rental-accra`
    - `/list-your-car-ghana`
    - `/peer-to-peer-car-rental-ghana`
  - Added shared template component: `src/components/seo/landing-template.tsx`.

## Admin Placeholders
- Implemented:
  - Enhanced existing authenticated admin overview (`src/app/admin/page.tsx`) with a "Platform controls (placeholders)" section.
  - Added placeholders/TODO notes for:
    - Listing approvals
    - Refund control
    - Review moderation
    - Disputes
    - Host approvals status note
- Placeholder/TODO due schema:
  - Requires moderation/dispute/refund workflow tables and states for full implementation.
