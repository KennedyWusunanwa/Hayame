# DATABASE_SCHEMA

Scope note: this schema inventory is based on SQL files checked into `db/` plus code references. Some runtime tables are referenced in API code but not defined in the checked-in migration SQL snapshot.

## Enums

- `booking_status`: `pending`, `awaiting_host`, `confirmed`, `rejected`, `cancelled`, `completed`, `refunded`
- `host_application_status`: `pending`, `approved`, `rejected`

## Confirmed tables from SQL migrations

### `profiles`

- Purpose: user profile and trust attributes for renter/host roles.
- Key fields: `id` (auth user FK), `full_name`, `phone`, `region`, `city`, `is_host`, `host_approved_at`, `id_verified`, `phone_verified`, `email_verified`, `host_level`.
- Relationships:
  - `id -> auth.users.id`
  - referenced by `cars.owner_id`, `bookings.renter_id`, `favorites.user_id`, `reviews.user_id`, `host_applications.user_id`, `disputes.opened_by`, `listing_views.viewer_id`.

### `host_applications`

- Purpose: host onboarding + verification workflow.
- Key fields: `user_id`, `status`, `id_type`, `id_number`, `id_front_path`, `id_back_path`, `experience`, `fleet_size`, `reviewed_at`, `reviewed_by`, `rejection_reason`.
- Relationships:
  - `user_id -> profiles.id`.

### `admin_actions`

- Purpose: admin audit trail.
- Key fields: `action`, `target_id`, `target_type`, `metadata`, `performed_by`, `created_at`.
- Relationships: no strict FK to target entities (generic target pointer design).

### `locations`

- Purpose: location catalog (city/region + optional coordinates).
- Key fields: `city`, `region`, `lat`, `lng`.
- Relationships:
  - `cars.location_id -> locations.id`.

### `cars`

- Purpose: listing inventory.
- Key fields: `owner_id`, `title`, `daily_price`, `city`, `region`, `car_type`, `brand`, `model`, `fuel_type`, `car_year`, `features`, `is_available`, `instant_book`, `delivery_available`, `air_conditioning`, `delivery_fee`, `insurance_fee`, `deposit_amount`, `outside_accra_fee`, `cancellation_policy`, `approval_status`, moderation fields.
- Relationships:
  - `owner_id -> profiles.id`
  - `location_id -> locations.id`
  - parent table for `car_photos`, `favorites`, `bookings`, `car_availability`, `reviews`, `listing_views`, `disputes`.

### `car_photos`

- Purpose: listing image metadata.
- Key fields: `car_id`, `url`.
- Relationships:
  - `car_id -> cars.id`.

### `favorites`

- Purpose: renter saves/bookmarks.
- Key fields: composite PK (`user_id`, `car_id`).
- Relationships:
  - `user_id -> profiles.id`
  - `car_id -> cars.id`.

### `bookings`

- Purpose: trip lifecycle, payment state, pricing breakdown.
- Key fields: `car_id`, `renter_id`, `start_date`, `end_date`, `status`, `hold_expires_at`, `payment_status`, `payment_reference`, `payment_provider`, `approved_at`, `rejected_at`, `trip_use_*`, `outside_accra_surcharge`, `nights`, `daily_rate`, `subtotal`, `platform_fee`, `insurance_fee`, `delivery_fee`, `deposit_amount`, `total_price`.
- Relationships:
  - `car_id -> cars.id`
  - `renter_id -> profiles.id`
  - parent for `reviews.booking_id` and `disputes.booking_id`.
- Integrity controls:
  - trigger `prevent_overlapping_active_bookings` to block overlapping active bookings.

### `car_availability`

- Purpose: host-defined availability/blackout windows.
- Key fields: `car_id`, `start_date`, `end_date`, `available`.
- Relationships:
  - `car_id -> cars.id`.

### `reviews`

- Purpose: post-trip ratings/comments.
- Key fields: `booking_id`, `car_id`, `user_id`, `rating`, `comment`, moderation fields (`is_hidden`, `moderated_at`, `moderated_by`, `moderation_reason`).
- Relationships:
  - `booking_id -> bookings.id`
  - `car_id -> cars.id`
  - `user_id -> profiles.id`.

### `platform_settings`

- Purpose: platform-level configuration.
- Key fields: singleton row (`id=1`), `platform_fee_percent`.
- Relationships: none.

### `listing_views`

- Purpose: listing impression tracking for analytics.
- Key fields: `car_id`, `viewer_id`, `session_key`, `view_date`, `created_at`.
- Relationships:
  - `car_id -> cars.id`
  - `viewer_id -> profiles.id`.
- Constraints/indexes:
  - unique daily anti-inflation index across (`car_id`, `coalesce(viewer_id::text, session_key)`, `view_date`).

### `disputes`

- Purpose: booking dispute workflow.
- Key fields: `booking_id`, `car_id`, `opened_by`, `reason`, `status`, `resolution_note`.
- Relationships:
  - `booking_id -> bookings.id`
  - `car_id -> cars.id`
  - `opened_by -> profiles.id`.

### `mobile_push_tokens`

- Purpose: mobile push token registry.
- Key fields: `user_id`, `platform` (`ios|android|web`), `device_token`.
- Relationships:
  - `user_id -> auth.users.id`.

## Confirmed views

### `car_search_view`

- Purpose: denormalized listing feed for discoverability and ranking.
- Includes: listing core fields + photo + rating/bookings aggregates + host trust metadata (`id_verified`, `phone_verified`, `email_verified`, `host_level`, `host_type`).
- Derived from joins of `cars`, `profiles`, `reviews`, `bookings`, `car_photos`.

## Referenced in code but missing DDL in checked-in SQL

These tables are used by API/UI code but no `CREATE TABLE` statements were found in current `db/*.sql` files:

- `conversations`
- `messages`
- `car_makes`
- `car_models`
- `gh_regions`
- `gh_districts`

Implication: production may depend on additional migrations not present in this repo snapshot, or external schema management outside checked-in SQL.
