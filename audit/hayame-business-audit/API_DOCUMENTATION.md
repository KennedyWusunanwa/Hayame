# API_DOCUMENTATION

Auth model used by route handlers:

- Web: Supabase cookie session (`createSupabaseServerClient`).
- Mobile/API clients: bearer token supported on most authenticated routes via `getRequestUser`.
- Admin: env credential cookie (`admin_auth`) for `/api/admin/*` routes.

## Discovery and listing APIs

| Endpoint                       | Purpose                                           | Parameters                                                                                                                                                                                                                                                       | Authentication                                                | Response                                                        |
| ------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `GET /api/cars`                | List cars with filters/sort/capabilities metadata | Query: `q`, `mine`, `limit`, `region`, `city`, `carType`, `brand`, `model`, `fuelType`, `transmission`, `seats`, `hostType`, `minPrice`, `maxPrice`, `minYear`, `maxYear`, `minRating`, `instantBook`, `deliveryAvailable`, `airConditioning`, `feature`, `sort` | Public; `mine=1` requires auth                                | `{ data: Car[], meta: { platform_fee_percent, capabilities } }` |
| `POST /api/cars`               | Create listing                                    | Body validated by `carFormSchema`                                                                                                                                                                                                                                | Auth + approved host                                          | `{ data: Car }`                                                 |
| `GET /api/cars/:id`            | Get listing detail                                | Path `id`                                                                                                                                                                                                                                                        | Public for approved listings (owner/admin can access pending) | `{ data: CarWithOwnerAndPhotos }`                               |
| `PUT /api/cars/:id`            | Update listing                                    | Path `id`, body `carFormSchema`                                                                                                                                                                                                                                  | Owner host or admin                                           | `{ data: Car }`                                                 |
| `DELETE /api/cars/:id`         | Delete listing                                    | Path `id`                                                                                                                                                                                                                                                        | Owner host or admin                                           | `{ ok: true }`                                                  |
| `GET /api/cars/:id/photos`     | List photo records                                | Path `id`                                                                                                                                                                                                                                                        | Owner or admin                                                | `{ data: Photo[], meta: { max_photos } }`                       |
| `POST /api/cars/:id/photos`    | Upload or replace photo                           | FormData: `file`, optional `replacePhotoId`                                                                                                                                                                                                                      | Owner or admin                                                | `{ data: Photo }`                                               |
| `DELETE /api/cars/:id/photos`  | Delete photo                                      | Body: `photoId`                                                                                                                                                                                                                                                  | Owner or admin                                                | `{ ok: true }`                                                  |
| `GET /api/car-catalog`         | Fetch make/model catalog                          | none                                                                                                                                                                                                                                                             | Public                                                        | `{ makes: [{ id, name, models[] }] }`                           |
| `GET /api/locations`           | Fetch region->city map                            | Query: `strict=true                                                                                                                                                                                                                                              | false`                                                        | Public                                                          | `{ data: Record<region, cities[]> }` (+ fallback message when static fallback used) |
| `GET /api/vehicle-details/:id` | Legacy listing detail endpoint                    | Path `id`                                                                                                                                                                                                                                                        | Public                                                        | `{ data: CarWithOwnerAndPhotos }` or 404                        |
| `POST /api/listing-views`      | Track listing impression                          | Body: `carId`, optional `sessionKey`                                                                                                                                                                                                                             | Optional auth                                                 | `{ ok: true }` (or `{ duplicate: true }`)                       |

## Favorites and reviews

| Endpoint              | Purpose                     | Parameters                              | Authentication                                                     | Response                 |
| --------------------- | --------------------------- | --------------------------------------- | ------------------------------------------------------------------ | ------------------------ | -------------------- |
| `GET /api/favorites`  | List current user favorites | none                                    | Required                                                           | `{ data: [{ car_id }] }` |
| `POST /api/favorites` | Toggle favorite             | Body: `{ carId, isFavorite }`           | Required                                                           | `{ ok: true }`           |
| `GET /api/reviews`    | List reviews by scope       | Query: `scope=host                      | mine` (default host)                                               | Required                 | `{ data: Review[] }` |
| `POST /api/reviews`   | Submit review               | Body: `{ bookingId, rating, comment? }` | Required; must be renter of completed trip, one review per booking | `{ data: Review }`       |

## Availability, booking, payment

| Endpoint                      | Purpose                                               | Parameters                                                                                                                                | Authentication       | Response                                       |
| ----------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------- | ------------------- |
| `GET /api/availability`       | Read blocked dates + availability for date range      | Query: `carId`, `startDate`, `endDate`                                                                                                    | Public               | `{ blockedDates, available, reason? }`         |
| `POST /api/availability`      | Write availability blocks                             | Body: `{ carId, startDate, endDate, available?, repeatDays? }`                                                                            | Host owner or admin  | `{ data: AvailabilityRows[] }`                 |
| `GET /api/bookings`           | Load bookings visible to user (renter + owner merged) | none                                                                                                                                      | Required             | `{ data: BookingRowsWithRoleAndConversation }` |
| `POST /api/bookings`          | Direct booking disabled                               | none                                                                                                                                      | n/a                  | `400` with guidance to Paystack flow           |
| `POST /api/bookings/hold`     | Create/reuse pending reservation hold                 | Body: `{ carId, startDate, endDate, tripUseRegion, tripUseCity, tripUseAddress, tripOutsideAccra? }`                                      | Required             | `{ bookingId, hold_expires_at }`               |
| `POST /api/bookings/paystack` | Verify payment and finalize booking                   | Body: `{ bookingId?, carId?, startDate?, endDate?, tripUseRegion?, tripUseCity?, tripUseAddress?, tripOutsideAccra?, reference, amount }` | Required             | `{ data: Booking, conversationId? }`           |
| `PATCH /api/bookings/:id`     | Host approve/reject paid request                      | Body: `{ action: "approve"                                                                                                                | "reject", reason? }` | Required; must be listing owner                | `{ data: Booking }` |

## Messaging APIs

| Endpoint                  | Purpose                                  | Parameters                                                                    | Authentication             | Response                          |
| ------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- | -------------------------- | --------------------------------- |
| `GET /api/conversations`  | List user conversations (+ unread count) | Query optional `carId`                                                        | Required                   | `{ data: ConversationSummary[] }` |
| `POST /api/conversations` | Create/find conversation                 | Body supports host/user/car resolution (`hostId`, `participantId?`, `carId?`) | Required                   | `{ id }`                          |
| `GET /api/messages`       | Load thread messages                     | Query: `conversationId`, optional `limit`, `since`, `markRead`                | Required; participant-only | `{ data: Message[] }`             |
| `POST /api/messages`      | Send message                             | Body: `{ conversationId, body }`                                              | Required; participant-only | `{ data: Message }`               |

## Host lifecycle and profile APIs

| Endpoint                               | Purpose                                 | Parameters                                | Authentication                        | Response                                       |
| -------------------------------------- | --------------------------------------- | ----------------------------------------- | ------------------------------------- | ---------------------------------------------- | ---------------------- |
| `GET /api/host-applications`           | Get latest application for current user | none                                      | Required                              | `{ data: HostApplication                       | null }`                |
| `POST /api/host-applications`          | Submit host application                 | Body validated by `hostApplicationSchema` | Required                              | `{ data: HostApplication }`                    |
| `GET /api/host-applications/:id/files` | Signed URL redirect for host ID file    | Query: `type=front                        | back`                                 | Required applicant or admin                    | Redirect to signed URL |
| `GET /api/host-status`                 | Read host approval status               | none                                      | Optional (returns host=false if anon) | `{ is_host, host_application_status, status }` |
| `POST /api/host-activate`              | Confirm host access state               | none                                      | Required                              | `{ is_host, status: "approved" }` or error     |
| `POST /api/profiles/upsert`            | Create/update own profile               | Body includes own `id` + profile fields   | Required; `id` must match user        | `{ ok: true }`                                 |

## Disputes

| Endpoint             | Purpose                                      | Parameters                    | Authentication                   | Response              |
| -------------------- | -------------------------------------------- | ----------------------------- | -------------------------------- | --------------------- |
| `GET /api/disputes`  | List disputes linked to renter/host bookings | none                          | Required                         | `{ data: Dispute[] }` |
| `POST /api/disputes` | Open dispute for booking                     | Body: `{ bookingId, reason }` | Required renter/host participant | `{ data: Dispute }`   |

## Admin APIs

| Endpoint                       | Purpose                                                  | Parameters                                                                             | Authentication | Response                      |
| ------------------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------- | ----------------------------- |
| `GET /api/admin/car-makes`     | List makes                                               | none                                                                                   | Admin cookie   | `{ data: Make[] }`            |
| `POST /api/admin/car-makes`    | Create make                                              | Body: `{ name }`                                                                       | Admin cookie   | `{ data: Make }`              |
| `PATCH /api/admin/car-makes`   | Update make                                              | Body: `{ id, name }`                                                                   | Admin cookie   | `{ data: Make }`              |
| `DELETE /api/admin/car-makes`  | Delete make                                              | Body: `{ id }`                                                                         | Admin cookie   | `{ ok: true }`                |
| `GET /api/admin/car-models`    | List models                                              | Query optional `makeId`                                                                | Admin cookie   | `{ data: Model[] }`           |
| `POST /api/admin/car-models`   | Create model                                             | Body: `{ name, makeId }`                                                               | Admin cookie   | `{ data: Model }`             |
| `PATCH /api/admin/car-models`  | Update model                                             | Body: `{ id, name }`                                                                   | Admin cookie   | `{ data: Model }`             |
| `DELETE /api/admin/car-models` | Delete model                                             | Body: `{ id }`                                                                         | Admin cookie   | `{ ok: true }`                |
| `GET /api/admin/messages`      | Admin messaging read APIs (users, conversations, thread) | Query: `scope=users`, `q`, or `conversationId`                                         | Admin cookie   | `{ office_profile_id, data }` |
| `POST /api/admin/messages`     | Start/send office conversation                           | Body action: `{ action:"start", userId }` or `{ action:"send", conversationId, body }` | Admin cookie   | `{ office_profile_id, data }` |

## Mobile-specific APIs

| Endpoint                                      | Purpose                                          | Parameters                                                 | Authentication | Response                                                                          |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------- |
| `POST /api/mobile/auth/login`                 | Mobile login                                     | `{ email, password }`                                      | Public         | `{ access_token, refresh_token, user }`                                           |
| `POST /api/mobile/auth/signup`                | Mobile signup                                    | `{ email, password, first_name, last_name, city, region }` | Public         | `{ access_token?, refresh_token?, user, requires_email_confirmation }`            |
| `POST /api/mobile/auth/refresh`               | Refresh token                                    | `{ refresh_token }`                                        | Public         | `{ access_token, refresh_token }`                                                 |
| `POST /api/mobile/auth/forgot-password`       | Password reset email                             | `{ email }`                                                | Public         | confirmation message                                                              |
| `POST /api/mobile/auth/resend-confirmation`   | Resend signup confirmation                       | `{ email }`                                                | Public         | confirmation message                                                              |
| `GET /api/mobile/me`                          | Token-based user bootstrap/profile/host status   | Header `Authorization: Bearer <token>`                     | Bearer token   | `{ user, profile, is_host, host_status, host_application... }`                    |
| `POST /api/mobile/bookings/hold`              | Mobile alias for booking hold                    | same as `/api/bookings/hold`                               | Required       | hold payload                                                                      |
| `POST /api/mobile/bookings/paystack/initiate` | Initialize checkout and return authorization URL | `{ bookingId, callbackUrl? }`                              | Required       | `{ data: { bookingId, reference, amount, authorization_url, payment_url, ... } }` |
| `POST /api/mobile/bookings/paystack/finalize` | Mobile alias for paystack finalize               | same payload as `/api/bookings/paystack`                   | Required       | finalized booking payload                                                         |
| `POST /api/mobile/push/register`              | Store device push token                          | `{ deviceToken, platform? }`                               | Required       | `{ registered: true/false, warning? }`                                            |

## Diagnostics

| Endpoint                   | Purpose                                              | Parameters  | Authentication | Response                                 |
| -------------------------- | ---------------------------------------------------- | ----------- | -------------- | ---------------------------------------- |
| `GET /api/debug/car-fetch` | Environment and direct-fetch debug for car retrieval | Query: `id` | Public         | debug object with env/rest/client checks |
