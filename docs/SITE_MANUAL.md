# Hayame Site Manual (Full, Plain-English Documentation)

## 1. What the Product Is
Hayame is a peer-to-peer car rental marketplace for Ghana. Guests can browse cars, select dates, pay online, and message hosts. Hosts can list cars, manage availability, and accept or reject booking requests. Admins can review host applications, manage catalog filters, and oversee listings.

## 2. Who Uses It (Roles)
Guest (not signed in)
- Browse marketing pages and explore listings.
- View car detail pages.
- Cannot book, favorite, or message without signing in.

Renter (signed-in user)
- Search and filter cars.
- Save favorites.
- Book cars and pay online.
- Message hosts.
- Leave reviews for completed trips.
- Manage bookings and profile in the dashboard.

Host (approved host application)
- All renter capabilities.
- Create and edit car listings.
- Set availability and weekly blocks.
- Review booking requests and approve or reject.
- Access host dashboard with inventory, bookings, reviews, and earnings (some items are sample data).

Admin
- Sign in with admin credentials.
- Review and approve or reject host applications.
- View platform overview (counts for users, cars, bookings, pending host applications).
- Manage car makes and models (filters catalog).
- Edit car listings and availability.
- View audit log entries for admin actions.

## 3. Global UI Elements
Navbar
- Shows public navigation links: Home, Explore, Prices, Blog, Contact.
- Shows Messages icon with unread count for signed-in users.
- Shows Dashboard and Become a Host (or Host Dashboard + List Your Car) based on host status.
- Shows Sign In/Sign Up when logged out.

Footer
- Shows company links (Pricing, Blog, Contact) and legal/support links (Privacy, Contact).

Navigation Loader
- Displays a full-screen loading overlay on link navigation or form submits.

## 4. Public / Marketing Pages
/
- Hero section with background image and “Get started” button.
- Search bar for region, city, car type, brand, model, and dates.
- Featured cars grid (Supabase data if available, otherwise mock cars).
- “How Hayame Works” steps and “Why Choose Hayame” section.

/blog
- Static list of blog posts with title, date, and tag. “Read more” links lead to Contact page.

/contact
- Contact info (phone, email, address).
- Contact form UI (name, email, message). This form does not submit to a backend.

/prices
- Static pricing tiers (Economy, Standard, Premium) with sample daily rates and features.
- Note: This page contains copy saying Paystack is coming soon; the actual booking flow already uses Paystack.

/privacy
- Simple privacy statement.

## 5. Explore and Search
/explore
- Loads cars from /api/cars (Supabase).
- Filters by region, city, car type, brand, model, fuel type, price range, and features.
- Search bar for car name or city.
- Map placeholder panel (live map not implemented yet; shows a preview list).
- Shows car cards with photo, type badge, location, price, and favorite button.

Search inputs (marketing hero + explore filters)
- Region and city come from Ghana regions and districts (API with fallback list).
- Car makes and models come from a catalog (admin-managed).

## 6. Car Detail Page
/cars/[id]
- Large image gallery with full-screen viewer.
- Car details: location, brand, model, type, seats, transmission, fuel, region.
- Description and features list.
- Availability summary from car availability windows.
- Booking widget with date picker and Paystack payment.
- Host card with basic profile info and link to host profile.
- Message host card with quick prompts.
- Reviews list and review form (only for users with completed bookings).

/vehicle-details/[id]
- Redirects to /cars/[id].

/hosts/[id]
- Host profile page showing host name, avatar, location, and that host’s listings.

## 7. Booking System (Full Flow)
Important concepts
- end_date is the checkout date and is exclusive for availability and pricing.
- Booking statuses include: pending, awaiting_host, confirmed, rejected, cancelled, completed, refunded.
- Payment statuses include: pending, paid, refunded, failed.

Step-by-step booking flow
1. User picks dates in the Booking Widget.
2. The widget loads blocked dates from /api/availability for the next 180 days.
3. When the user clicks “Book now,” the app creates a 15-minute reservation hold:
   - POST /api/bookings/hold
   - A booking is created with status=pending and hold_expires_at=now+15m.
4. The UI shows a countdown “Reserved for X minutes.”
5. The Paystack popup opens for payment.
6. On Paystack success, the app verifies payment and finalizes the booking:
   - POST /api/bookings/paystack
   - Conflicts are re-checked server-side.
   - Total price is calculated as daily_price x nights (nights = end_date - start_date).
7. Final status after payment:
   - If instant_book=true for the car: status becomes confirmed and approved_at is set.
   - Otherwise: status becomes awaiting_host (host must approve).
8. The user is redirected to /dashboard/bookings.

Booking holds
- Holds are valid for 15 minutes.
- Expired holds are cleaned up opportunistically when availability or hold endpoints run.
- Expired holds are marked cancelled and payment_status=failed.

Host approval
- Host can approve or reject bookings in /host/bookings.
- Approve sets status to confirmed and approved_at to now.
- Reject triggers a Paystack refund and sets status to rejected and payment_status=refunded.

Availability and blocking
- /api/availability returns a list of blocked dates.
- Blocked dates include:
  - Host availability blocks (car_availability with available=false).
  - Bookings in pending/awaiting_host/confirmed where holds are not expired.
- If cars.is_available is false, availability returns unavailable for the entire range.

Weekly blocks
- Hosts can choose weekdays to block (e.g., every Monday).
- The system inserts one-day blocks only for the chosen weekdays within a horizon.

Overlapping booking protection
- A database trigger prevents overlapping bookings with status awaiting_host or confirmed.
- It uses advisory locks to reduce race conditions.

What is NOT automated
- There is no automatic job to mark bookings as completed after end_date.
- Completion must be updated manually or via future automation.

## 8. Messaging System
/messages
- Two-column inbox and chat view.
- Search bar and “All / Unread” tabs.
- Unread badge shown in the navbar.
- Realtime updates using Supabase Realtime on the messages table.

Starting a conversation
- A renter can open a chat from a car’s detail page.
- The app creates or reuses a conversation for the renter and host.

Sending messages
- Messages are sent through /api/messages.
- The recipient gets an email notification if email is configured.

Read status
- Messages are marked read when the conversation is opened.

Host contact reveal after booking
- If the renter has an active booking (awaiting_host/confirmed/completed/refunded) for the host’s car, the chat header shows:
  - Host full name
  - Host location (city)
  - Host phone number

## 9. Favorites
- Users can save cars by clicking the heart button.
- Favorites are stored per user and are visible in /dashboard/favorites.
- Hosts see favorite counts per listing in /host/favorites.

## 10. Reviews
- Reviews are tied to completed bookings only.
- Users can submit one review per completed booking.
- Hosts see all reviews for their listings in /host/reviews.

## 11. User Dashboard
/dashboard
- Summary cards for Bookings, Favorites, Profile.

/dashboard/bookings
- Shows user’s bookings in a table.
- Displays booking status and payment status.

/dashboard/favorites
- Shows saved cars list and a total count.

/dashboard/profile
- Update profile name, avatar, region, and city.
- Uses Supabase Storage for avatar uploads.

Dashboard redirects
- /dashboard/cars, /dashboard/earnings, /dashboard/reviews
  - If user is a host, these redirect to host dashboards.
  - If not a host, they redirect to /become-host.

## 12. Host Dashboard
/host
- Overview dashboard with stats and charts (currently mock/sample data).
- Shows upcoming bookings (sample data).

/host/cars
- Inventory list of the host’s cars.
- Shows favorites count, location, type, price, and availability status.
- Actions: edit or delete listings.

/host/cars/new
- Create a new listing with price, location, car type, brand, model, seats, transmission, fuel, features, availability, and instant book toggle.
- Photo upload happens after saving (edit screen).

/host/cars/[id]/edit
- Edit listing and manage availability.
- Set explicit date blocks and recurring weekly blocks.

/host/bookings
- See bookings for host’s cars.
- Approve or reject requests once payment is confirmed.

/host/earnings
- Earnings summary and payout history (sample data).

/host/favorites
- Overview of favorites across host cars.

/host/profile
- Update host profile details and avatar.

/host/reviews
- View reviews from guests for host listings.

## 13. Host Application Process
/become-host
- Requires sign-in.
- Host application form includes:
  - Full name, phone, region, city
  - ID type and ID number
  - ID front and back images (uploaded to host-ids bucket)
  - Hosting experience, fleet size, and notes
- Application statuses: pending, approved, rejected.
- If approved, the page shows a “Go to host dashboard” link.

Host activation
- /api/host-activate checks if the latest host application is approved.
- /api/host-status returns current host status for the navbar.

## 14. Admin Console
/admin
- Admin login with ADMIN_USERNAME and ADMIN_PASSWORD (stored in a cookie).
- Overview tab shows counts for users, cars, bookings, pending host applications.
- Approved hosts list with vehicle counts.
- Vehicles & availability overview with quick edit link.
- Admin audit log for host approvals and rejections.
- Host applications tab lists pending/approved/rejected applications with details and ID file links.
- Admin can approve or reject host applications.
- Approval/rejection triggers email notifications to the applicant (if email is configured).

/admin/filters
- Manage car makes and models that appear in search filters.

/admin/cars/[id]/edit
- Admin can edit car details and availability.

## 15. Payments (Paystack)
- Paystack inline checkout is used on the booking widget.
- The server verifies each transaction with the Paystack API before confirming bookings.
- Amounts are in minor currency units (GHS x 100).
- Refunds are triggered when a host rejects a booking.

## 16. Email Notifications
Emails are sent via Resend if configured.

Triggers
- New message received (message email with conversation link).
- Booking payment verified (renter + host notice).
- Host approves or rejects booking (renter notified).
- Admin approves or rejects host application (applicant notified).

Requirements
- RESEND_API_KEY and RESEND_FROM must be set in environment.
- SUPABASE_SERVICE_ROLE_KEY must be set in production to fetch recipient emails.
- Email links use EMAIL_BASE_URL or NEXT_PUBLIC_SITE_URL (or VERCEL_URL fallback).

Official footer
- Every email includes an official notification footer and a “Visit Hayame” link.

## 17. Data Storage (Supabase)
Database tables used
- profiles
- host_applications
- cars
- car_photos
- car_availability
- bookings
- favorites
- conversations
- messages
- reviews
- locations, gh_regions, gh_districts
- admin_actions

Storage buckets
- car-photos (public)
- host-ids (private)
- avatars (profile photos)

## 18. Availability Rules (Exact Behavior)
- A date range blocks dates from start_date up to (but not including) end_date.
- Weekly blocks insert one-day rows for each selected weekday.
- Booking holds block dates only if hold_expires_at is in the future.
- If cars.is_available is false, the entire requested range is treated as blocked.

## 19. Fallbacks and Placeholders
- Featured cars uses mock data if Supabase is unreachable.
- Explore page map is a placeholder panel (map integration not implemented).
- Host dashboard stats and earnings are sample data.
- Blog posts and pricing tiers are static content.

## 20. API Endpoints (What They Do)
- /api/availability
  - GET: returns blocked dates and availability
  - POST: creates availability windows or weekly blocks
- /api/bookings
  - GET: list bookings for renter and host
  - POST: disabled (Paystack flow required)
- /api/bookings/hold
  - Creates a 15-minute pending hold
- /api/bookings/paystack
  - Verifies payment and confirms booking
- /api/bookings/[id]
  - Host approve/reject booking
- /api/cars
  - GET: list cars
  - POST: create car (host only)
- /api/cars/[id]
  - GET: car details
  - PUT: update car (host/admin)
  - DELETE: delete car (host/admin)
- /api/conversations
  - POST: start or reuse a conversation
- /api/messages
  - POST: send a message (triggers email)
- /api/favorites
  - GET: list user favorites
  - POST: add/remove favorite
- /api/reviews
  - POST: create review for completed booking
- /api/host-applications
  - GET: fetch user’s latest application
  - POST: submit application
- /api/host-applications/[id]/files
  - GET: signed URL for ID images (admin or owner)
- /api/host-status
  - GET: returns host status for navbar
- /api/host-activate
  - POST: verifies host approval status
- /api/locations
  - GET: Ghana regions and cities (fallback if not available)
- /api/car-catalog
  - GET: car makes and models
- /api/vehicle-details/[id]
  - GET: car detail payload (legacy endpoint)
- /api/admin/car-makes
  - Manage car makes (admin only)
- /api/admin/car-models
  - Manage car models (admin only)
- /api/debug/car-fetch
  - Diagnostics for car fetch via REST + Supabase client

## 21. Important Notes and Known Gaps
- Booking completion is not automated; bookings must be marked completed manually.
- Some marketing copy (Prices page, Host dashboard) references “Paystack coming soon” while Paystack is already in use in bookings.
- Contact form does not send messages yet (no backend).
- Map view is a placeholder.

## 22. Summary for Non-Technical Stakeholders
- Users can discover cars, book with online payment, and chat with hosts.
- Hosts can list cars, manage availability, and approve bookings.
- Admins can manage host approvals and car catalogs.
- Email notifications are sent for messages and booking decisions when configured.

End of document.
