# Hayame 2.0 User Manual

Last updated: March 4, 2026

## 1. Purpose Of This Manual

This is a full non-technical manual for Hayame 2.0.

It explains:

- Every user-facing feature.
- Every page and button.
- What each control does.
- What conditions change behavior (for example: signed in vs signed out, host approved vs not approved).

This manual does not explain source code.

## 2. User Roles And Access

### Guest (not signed in)

Can:

- Open public pages.
- Search and browse listings.
- Open car details.

Cannot:

- Save favorites.
- Start bookings.
- Message hosts.
- Leave reviews.

### Renter (signed-in user)

Can:

- Do everything a guest can do.
- Save and remove favorites.
- Book and pay.
- Message hosts.
- Open disputes for paid trips.
- Leave reviews for completed trips only.
- Manage profile, bookings, favorites.

### Host (approved host)

Can:

- Do everything a renter can do.
- Access host dashboard pages.
- Create, edit, and delete own listings.
- Upload/replace/remove listing photos.
- Set listing availability blocks.
- Approve or reject booking requests on own cars.

### Admin

Can:

- Access admin portal after admin sign in.
- Approve/reject host applications.
- Review listings.
- Edit users and listings.
- Process refunds.
- Moderate reviews.
- Update disputes.
- Manage make/model filter catalog.
- Send official office messages to users.

## 3. Global Interface (Visible Across The Site)

### 3.1 Top Navigation Bar (Desktop)

Always-visible links:

- `Home` -> opens home page.
- `Explore` -> opens listings browse page.
- `Prices` -> opens pricing page.
- `Blog` -> opens blog page.
- `Contact` -> opens contact page.

Signed-out actions:

- `Log in` -> opens login page.
- `Sign up` -> opens signup page.

Signed-in actions:

- Username pill -> shows signed-in user label.
- Messages icon -> opens `/messages`.
- Messages badge (`1`, `2`, `99+`) -> unread message count.
- `Dashboard` -> renter dashboard (if not approved host).
- `Become a Host` -> host application page (if not approved host).
- `Application pending` -> same destination as Become a Host, label changes when host request is pending.
- `Host dashboard` -> host dashboard (if approved host).
- `Host dashboard` booking badge -> count of paid requests waiting for host decision.
- `List Your Car & Earn` -> listing creation page.
- `Sign out` -> logs out and returns to home page.

### 3.2 Mobile Top Bar

Controls:

- Messages icon (only if signed in) -> opens `/messages`.
- Menu icon -> opens right-side menu panel.

Inside menu panel:

- Same page links as desktop.
- Account actions based on role (`Dashboard`, `Host dashboard`, `Become a Host`, `List Your Car & Earn`, `Sign out`, `Log in`, `Sign up`).

### 3.3 Footer

Company links:

- `Pricing`
- `Blog`
- `Contact`

Legal/support links:

- `Privacy`
- `Protection`
- `Support` (opens Contact page)

### 3.4 Navigation Loading Overlay

Behavior:

- A spinner overlay appears when a page link or submit button triggers navigation.
- It auto-clears after navigation completes.
- Safety timeout also clears it if navigation hangs.

## 4. Authentication Pages

### 4.1 Login Page (`/auth/login`)

Controls:

- `Email` input.
- `Password` input.
- `Show` / `Hide` button -> toggles password visibility.
- `Log in` button -> signs in and sends user to home page.
- `Sign up` text link -> opens signup page.

Error behavior:

- Invalid credentials show inline error text.

### 4.2 Signup Page (`/auth/signup`)

Controls:

- `First name`
- `Last name`
- `Email`
- `Region` dropdown
- `City / Location` dropdown (enabled only after Region is chosen)
- `Profile photo (optional)` file picker
- `Password`
- `Show` / `Hide` password toggle
- `Sign up` button
- `Log in` text link

Post-submit behavior:

- Shows verification info message.
- Redirects to login page.

## 5. Public Marketing Pages

### 5.1 Home (`/`)

Sections include hero, search, trust blocks, featured cars, and info blocks.

Main controls:

- `Book Now` (hero button) -> opens Explore page.

Hero search controls (desktop and mobile versions):

- Region dropdown
- City dropdown (depends on selected region)
- Car type dropdown
- Brand dropdown
- Model dropdown (depends on selected brand)
- Date fields
- Search text input (mobile)
- `Search` button -> opens Explore with selected filters.

Mobile filter panel controls:

- `Close` -> closes filter panel.
- `Apply` -> applies current filters and searches.

Featured cars controls:

- Car card click -> opens that car detail page.
- Heart icon -> save/remove favorite (requires login).
- `Previous featured cars` arrow and `Next featured cars` arrow are shown but currently do not move the list.

### 5.2 Prices (`/prices`)

Tier cards include:

- `Start booking` button on each tier.

Current behavior:

- This is a static button (no booking start action from this page).

### 5.3 Blog (`/blog`)

Each card has:

- `Read more` -> opens Contact page.

### 5.4 Contact (`/contact`)

Form fields:

- Name
- Email
- Message
- `Submit` button

Current behavior:

- Contact form is visual only right now (no backend sending).

### 5.5 Protection (`/protection`)

Contains informational cards and:

- `contact page` link.

### 5.6 Privacy (`/privacy`)

Informational text only (no form controls).

### 5.7 Cancellation (`/cancellation`)

Contains policy details and links:

- `Messages`
- `Contact`

### 5.8 SEO Landing Pages

Pages include:

- `/airport-car-rental-accra`
- `/cheap-car-rental-ghana`
- `/rent-a-car-accra`
- `/suv-rental-ghana`
- `/peer-to-peer-car-rental-ghana`
- `/list-your-car-ghana`

Quick link buttons on these pages:

- `Browse cars` -> Explore page
- `Become a Host` -> host application page
- `Host dashboard` -> host dashboard

## 6. Explore And Search (`/explore`)

### 6.1 Main Search Controls

- Search input (`Search cars or cities`)
- `Search` button
- Sort dropdown (`Sort by`)

Sort options:

- `Price (Low -> High)`
- `Price (High -> Low)`
- `Most booked`
- `Top rated`
- `New listings`

Some sort options may show `Coming soon` when data is not available.

### 6.2 Filters Panel

Desktop has left sidebar. Mobile uses `Filters` button + slide panel.

All filter controls:

- Region
- City (depends on Region)
- Car type
- Brand
- Model (depends on Brand)
- Fuel
- Price range slider
- Min price
- Max price
- Transmission
- Seats
- Min year
- Max year
- Instant Book toggle
- Delivery available toggle
- Air conditioning toggle
- Min rating
- Host type
- Feature checkboxes
- `Reset filters` button

Mobile panel extra control:

- `Apply` button -> closes panel and applies filters.

### 6.3 Map Panel Behavior

- Map placeholder is shown only when no filters are active.
- It is a visual placeholder, not a live map.

### 6.4 Car Card Controls

On each card:

- Card click -> opens car detail page.
- Heart button -> save/remove favorite.

If user is not logged in and clicks heart:

- App sends user to login page.

## 7. Car Detail Page (`/cars/[id]`)

### 7.1 Top Controls

- Heart button beside title -> save/remove favorite.

### 7.2 Image Gallery Controls

Main image area:

- Click image -> opens full-screen viewer.

Thumbnail strip:

- Click thumbnail -> switches active image.

Full-screen viewer:

- `Close` (X)
- `Previous image`
- `Next image`
- Thumbnail buttons
- Keyboard arrows and swipe gestures also work.

### 7.3 Availability Panel

`Availability preview` card controls:

- `Start` date
- `End` date
- `Check availability` button

Result text shows whether chosen dates are available or unavailable.

### 7.4 Booking Widget Controls

Inputs and controls:

- `Start date`
- `End date`
- Quick select buttons: `2 days`, `5 days`, `7 days`
- Trip use `Region`
- Trip use `City / district`
- Trip use `Exact area / destination`
- `View protection details` link
- Main booking button label:
  - `Instant Book` (for instant listings)
  - `Book Now` (for host-approval listings)

Validation behavior before payment:

- End date must be after start date.
- Region, city, and exact area are required.

Payment behavior:

- Starts a temporary reservation hold.
- Opens Paystack payment popup.

After successful payment:

- User is redirected to Messages.
- If a booking conversation exists, it opens that exact chat.

### 7.5 Host Card Controls

- `View host` button -> opens host profile page.

### 7.6 Message Host Card Controls

Quick prompt chips:

- `Hi! Is this car available this week?`
- `Can I pick up the car in the morning?`
- `Do you offer delivery or pickup?`
- `What documents do you require?`

Actions:

- `Send message` -> starts conversation and sends selected prompt.
- `Chat without message` -> starts conversation without sending prompt.
- `Sign in to message` -> shown when logged out.

### 7.7 Review Form Controls

If eligible:

- Trip selector dropdown
- Rating buttons `1`, `2`, `3`, `4`, `5`
- Comment box
- `Submit review`

Review can only be submitted by:

- Logged-in renter
- Completed trip
- Not already reviewed for that booking

### 7.8 Existing Booking Notice

If current renter already booked that car:

- Banner appears.
- `Take me to my dashboard bookings` button -> opens renter bookings page.

## 8. Messaging (`/messages`)

### 8.1 Conversation List Controls

- Search input
- Tab buttons: `All`, `Unread`
- Conversation row click -> open that thread

### 8.2 Thread Controls

- Mobile `Back` button -> return to conversation list
- `Load older messages` button (shown when enough history exists)
- Composer text area
- `Send` button

### 8.3 Contact Reveal Rule

Renter sees host full contact block in chat only when renter has an active valid booking status for that listing conversation.

## 9. Renter Dashboard (`/dashboard`)

### 9.1 Overview

Cards and links:

- `View bookings`
- `View favorites`
- `Edit profile`

### 9.2 Bookings (`/dashboard/bookings`)

Actions inside booking cards/table:

- `Message` -> opens related chat
- `Open dispute` -> shown for renter on paid bookings

Status and trip details are visible in expanded booking cards.

### 9.3 Favorites (`/dashboard/favorites`)

Read-only list of saved cars.
No direct action buttons on this page.

### 9.4 Profile (`/dashboard/profile`)

Controls:

- `Upload photo`
- `View current` (link if avatar exists)
- Username / first name / last name / phone / region / city fields
- `Save profile`

Region-city dependency:

- City choices depend on selected region.

### 9.5 Renter Mobile Quick Nav

Buttons:

- `Overview`
- `Bookings`
- `Chats`
- `Favorites`
- `Profile`

Unread chat badge appears on `Chats` when messages are unread.

## 10. Become Host (`/become-host`)

### 10.1 Host Application Form Controls

Fields:

- Full name
- Phone
- Region
- City
- ID type
- ID number
- ID front image upload
- ID back image upload
- Hosting experience
- Fleet size
- Notes

Action button:

- `Submit application`

Status behavior:

- If already pending: form locks with pending notice.
- If rejected: rejection reason is shown.
- If approved: form replaced with host dashboard link.

### 10.2 Approved State Control

- `Go to host dashboard` -> validates host access and opens host dashboard.

## 11. Host Dashboard (`/host`)

### 11.1 Host Overview Page

Controls:

- `Start Earning Today` -> opens new listing form.
- `Review now` -> appears on urgent pending requests, opens host bookings.
- `Open booking request` -> shown on mobile trip cards for awaiting host requests.

Other controls:

- Earnings calculator inputs:
  - Price per day
  - Days rented per month
  - Platform fee percent

### 11.2 Host Sidebar / Mobile Nav Buttons

Sidebar links:

- `Overview`
- `Vehicles`
- `Bookings`
- `Favorites`
- `Earnings`
- `Reviews`
- `Host settings`

Mobile quick nav links:

- `Overview`
- `Vehicles`
- `Bookings`
- `Chats`
- `Settings`

Booking request and unread chat badges appear when counts are above zero.

## 12. Host Cars And Listing Management

### 12.1 My Cars (`/host/cars`)

Controls:

- `List Your Car & Earn` -> new listing page.
- Per-car action icons:
  - Edit (pencil) -> edit listing page
  - Delete (trash) -> deletes listing after confirmation dialog

### 12.2 New Listing (`/host/cars/new`) And Edit Listing (`/host/cars/[id]/edit`)

#### A. Basic listing fields

- Auto title preview (generated from brand + model + year)
- Daily price
- Region
- City
- Car type
- Brand
- Model
- Seats
- Car year
- Transmission
- Fuel
- Cancellation policy
- Description

#### B. Fees and options

- Delivery available toggle
- Delivery fee (enabled only when delivery toggle is on)
- Insurance fee
- Deposit amount
- Outside Accra surcharge

#### C. Features

- Priority feature checkboxes
- Full feature checklist

#### D. Photos section controls

- File picker (multiple)
- Existing photo controls:
  - `Replace`
  - `Remove`
- New selected file control:
  - `Remove`

Photo rules shown in UI:

- Recommended: 5 to 7 photos.
- Hard cap: 7 photos.
- Warnings are shown for quality and quantity.
- Upload does not auto-reject because of quality; quality mainly affects approval outcome.

#### E. Listing status toggles

- `Available` checkbox
- `Instant Book` checkbox

#### F. Form actions

- `Submit car` (new listing)
- `Save car` (edit)
- `Cancel`

Post-submit behavior:

- New and edited host listings redirect to host dashboard.
- Listing goes to review workflow before public visibility.

### 12.3 Availability Editor (on edit page)

Block specific dates:

- Date range picker
- `Mark as available` checkbox
- `Save date window`

Weekly recurring blocks:

- Day pills: `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`
- Horizon dropdown: `30`, `60`, `90`, `180` days
- `Save weekly blocks`

## 13. Host Bookings, Favorites, Earnings, Reviews, Profile

### 13.1 Host Bookings (`/host/bookings`)

Per booking actions:

- `Message`
- `Approve` (host side, only when request is awaiting host and payment is paid)
- `Reject` or `Reject & refund`
- `Open dispute` may appear on renter-side entries shown in host combined view

### 13.2 Host Favorites (`/host/favorites`)

Shows metrics and favorites by car.
No direct edit buttons.

### 13.3 Host Earnings (`/host/earnings`)

Shows sample cards/charts/table.
No transactional payout action buttons.

### 13.4 Host Reviews (`/host/reviews`)

Read-only review table.

### 13.5 Host Profile (`/host/profile`)

Uses same profile controls as renter profile:

- `Upload photo`
- `View current`
- Profile fields
- `Save profile`

## 14. Admin Portal

## 14.1 Admin Sign-In (`/admin` when logged out)

Controls:

- Username field
- Password field
- `Sign in`

If credentials are wrong, error text is shown.

## 14.2 Admin Top Header Actions (logged in)

- `Messages`
- `Manage filters`
- `Platform controls`
- `Sign out`

## 14.3 Admin Mobile Tab Switch

Buttons:

- `Overview`
- `Applications`

## 14.4 Admin Overview Section Controls

Users card controls:

- `Message` -> open office chat with user
- `View` -> open detailed admin user page

Vehicles and availability controls:

- Per listing checkbox `Select`
- `Delete selected`
- `Preview`
- `Edit`
- `Delete`

Platform card control:

- `Open platform controls`

## 14.5 Admin Host Applications Section Controls

Filters and search:

- Status pills: `pending`, `approved`, `rejected`
- Search input (name/phone)

Per pending application actions:

- `Approve`
- `Reject`
- Optional rejection reason input (desktop)
- `Front` and `Back` links for ID files

## 14.6 Admin Platform Controls (`/admin/platform`)

Listing approvals table actions:

- `Demo preview`
- `Approve`
- `Reject`
- `Delete`

Refund control actions:

- Reason input
- `Refund`

Review moderation actions:

- `Hide` (with optional reason)
- `Unhide`

Disputes actions:

- Status dropdown (`open`, `under_review`, `resolved`, `closed`)
- Resolution note input
- `Save`

## 14.7 Admin Filter Catalog (`/admin/filters`)

Make manager:

- Add make input + `Add`
- Per make `Delete`

Model manager:

- Make selector
- Add model input + `Add`
- Per model `Delete`

## 14.8 Admin Office Messaging (`/admin/messages`)

Left side:

- User search
- User row `Message` (starts office conversation)
- Conversation row click (opens thread)

Thread side:

- Message input (`Send message as Hayame office...`)
- `Send`

## 14.9 Admin User Detail (`/admin/users/[id]`)

Main form control:

- `Save user changes`

Editable groups include:

- Personal info
- Verification and host status
- Host application details

Evidence and read-only sections include:

- Face photo
- ID front/back previews + `Open original`
- Listings/bookings/conversations tables

## 14.10 Admin Listing Preview (`/admin/cars/[id]/preview`)

Controls:

- `Open live page`
- `Edit listing`
- `Back to approvals`

## 14.11 Admin Listing Edit (`/admin/cars/[id]/edit`)

Same listing edit controls as host listing form, plus:

- `Back to admin`

## 15. What Affects What (Dependency Map)

1. Sign-in state affects:

- Whether user can favorite, book, message, review, apply as host.
- Navbar actions shown.

2. Host application status affects:

- Access to host pages.
- Whether user sees `Become a Host`, `Application pending`, or `Host dashboard`.

3. Listing approval status affects:

- Public visibility in explore/home.
- Pending/rejected listings stay out of normal public browse for non-owners.

4. Listing availability toggle (`Available`) affects:

- Whether any date can be booked.
- If set off, system treats requested range as unavailable.

5. Availability windows and weekly blocks affect:

- Which dates are blocked in date pickers.
- Which bookings are allowed.

6. Temporary booking hold affects:

- Date locking during payment window.
- Hold expiration can release dates and cancel pending hold.

7. Instant Book toggle affects:

- Booking button label (`Instant Book` vs `Book Now`).
- Post-payment status (`confirmed` immediately vs `awaiting_host`).

8. Host booking decision affects:

- Booking status (`confirmed` or `rejected`).
- Rejection triggers refund path.

9. Payment status affects:

- Whether host action buttons are enabled in some booking rows.
- Whether renter can open dispute from booking row.

10. Trip-use location affects total price:

- If trip-use area is outside Greater Accra, outside-Accra surcharge can be added.

11. Region and brand selections affect dependent fields:

- Region controls available city options.
- Brand controls available model options.

12. Unread messages affect badges:

- Navbar message icon badge.
- Mobile quick nav chat badge.

13. Completed-trip requirement affects reviews:

- Review form only works for completed bookings not already reviewed by same user.

14. Active booking relationship affects chat contact reveal:

- Host contact details in chat appear when renter has eligible booking status.

15. Photo count and quality affect listing approval probability:

- Upload is allowed with warnings.
- Better quantity/quality generally improves approval chance.

## 16. Status Definitions

### 16.1 Booking status

- `pending`: temporary hold before final payment confirmation.
- `awaiting_host`: paid, waiting for host approval.
- `confirmed`: booking approved and active.
- `rejected`: host rejected request.
- `cancelled`: booking cancelled/expired hold.
- `completed`: trip finished.
- `refunded`: booking refunded.

### 16.2 Payment status

- `pending`
- `paid`
- `refunded`
- `failed`

### 16.3 Host application status

- `pending`
- `approved`
- `rejected`

### 16.4 Listing approval status

- `pending`
- `approved`
- `rejected`

### 16.5 Dispute status

- `open`
- `under_review`
- `resolved`
- `closed`

## 17. Current Placeholders / Coming Soon

- Explore map is a placeholder, not a live interactive map.
- Featured cars left/right arrows are visible but not active controls.
- Contact page submit button is currently non-sending.
- Some sort/filter capabilities can show `Coming soon` when data support is missing.
- Protection page sections are informational placeholders.
- Host earnings page uses sample payout/trend data.

## 18. End-To-End User Flows

### 18.1 Renter booking flow

1. Search on Home/Explore.
2. Open car page.
3. Pick dates and trip-use location.
4. Press `Book Now` or `Instant Book`.
5. Complete payment popup.
6. System creates/updates booking and opens Messages conversation.
7. Track booking in dashboard bookings page.

### 18.2 Host listing flow

1. Apply via `Become a Host`.
2. After approval, open `Host dashboard`.
3. Use `List Your Car & Earn`.
4. Fill listing form and upload photos.
5. Submit listing.
6. Listing enters review status.
7. Manage updates, availability, and bookings from host pages.

### 18.3 Admin moderation flow

1. Sign in at admin portal.
2. Review host applications and approve/reject.
3. Review listings in platform controls.
4. Refund, moderate reviews, and update disputes as needed.
5. Communicate through admin office messaging.

End of manual.
