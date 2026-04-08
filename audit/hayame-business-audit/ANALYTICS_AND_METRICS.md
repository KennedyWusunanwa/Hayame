# ANALYTICS_AND_METRICS

## Metrics currently measurable from code/data model

| Metric                         | Implementation source                                                  | Current status |
| ------------------------------ | ---------------------------------------------------------------------- | -------------- |
| Bookings volume                | `bookings` table + `/api/bookings` + admin counts                      | measurable     |
| Booking status funnel          | `bookings.status` lifecycle (`pending -> awaiting_host/confirmed/...`) | measurable     |
| Paid bookings                  | `bookings.payment_status='paid'`                                       | measurable     |
| Active hosts                   | `profiles.is_host=true` counts                                         | measurable     |
| Active cars/listings           | `cars` table (approved/availability statuses)                          | measurable     |
| Listing views                  | `listing_views` table + `ListingViewTracker`                           | measurable     |
| Conversion proxy               | Host dashboard computes `paidBookings / totalViews`                    | measurable     |
| Ratings/review volume          | `reviews` table + `car_search_view` aggregates                         | measurable     |
| Gross booking value proxy      | `bookings.total_price` aggregation                                     | measurable     |
| Platform fee potential revenue | `bookings.platform_fee` + `platform_settings`                          | measurable     |
| Favorites demand signal        | `favorites` table + host favorites dashboard                           | measurable     |
| Dispute rate proxy             | `disputes` table vs booking counts                                     | measurable     |

## Where metrics are surfaced today

- Home page metrics component (`cars`, `bookings`, `approved hosts` counts).
- Host dashboard:
  - Earnings totals (lifetime/month)
  - Booking rate
  - Views and conversion rate
  - Review counts/average rating
- Admin dashboard/platform:
  - User, vehicle, booking, pending application counts
  - Refundable bookings, moderated reviews, disputes

## Existing analytics instrumentation

- Listing impression event capture via `POST /api/listing-views`.
- Booking/payment events represented in transactional state transitions and timestamps.
- Messaging unread counts and conversation activity tracked in DB tables.

## Gaps for investor-grade KPI stack

- No dedicated analytics warehouse/pipeline detected.
- No cohort retention/LTV pipeline found.
- No explicit conversion attribution by channel/campaign found.
- No third-party product analytics SDK (e.g., PostHog/Mixpanel/Segment) detected.
- No standardized executive KPI API/reporting layer yet.

## Suggested KPI set for business plan modeling

- GMV: sum of `bookings.total_price` on paid/confirmed/completed states.
- Net platform revenue: sum of `platform_fee` minus refunds/adjustments.
- Fill rate: confirmed or completed bookings / approved listings.
- Host activation rate: approved hosts with at least one active approved listing.
- Listing conversion: paid bookings / unique daily listing viewers.
- Dispute incidence: disputes opened / paid bookings.
