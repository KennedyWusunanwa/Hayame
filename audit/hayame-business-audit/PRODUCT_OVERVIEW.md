# PRODUCT_OVERVIEW

## Audit scope actually found in workspace
- Primary web/backend repo: `/Users/profdouglas/Desktop/Hayame 2.0 `
- Native iOS repo: `/Users/profdouglas/Desktop/Hayame 2.0 /HayameIOS`
- Not found in current workspace: separate `hayame-web`, `hayame-api`, `hayame-admin`, `hayame-dashboard`, `hayame-mobile`, `hayame-android` repos.

## What Hayame is
Hayame is a Ghana-focused, Turo-style peer-to-peer car rental marketplace where individual or small-fleet hosts list vehicles and renters discover, book, pay, and communicate in-platform.

## Core value proposition
- For renters: localized discovery and booking of cars across Ghana with transparent pricing and in-app host communication.
- For hosts: listing, booking request management, and performance visibility from a dedicated host dashboard.
- For platform: moderated host onboarding, listing approvals, refund/dispute controls, and operating levers through admin tools.

## Problem being solved
- Fragmented local car-rental discovery and trust.
- Limited standardized online booking/payment flow for local hosts.
- Weak renter-host coordination before/after booking.

## Target users
- Renters/guests looking for short-term vehicle access in Ghana.
- Approved hosts listing personal or fleet vehicles.
- Platform operators/admin staff handling approvals, moderation, support, and disputes.

## Platform type
- Peer-to-peer car sharing / rental marketplace (Turo-like model), localized to Ghana.

## Unique differentiators observed in code
- Ghana-first location model (region/city and Accra-specific/outside-region surcharge logic).
- Hold-first booking flow (15-minute reservation hold before payment finalization).
- Dual booking modes: instant book and host-approval.
- Host application workflow with ID document upload to private storage.
- Contact reveal gating tied to paid/valid booking states.
- Combined web platform + native iOS app with dedicated mobile auth/payment wrappers.

## Key product features
- Search and filtering across car attributes, host trust attributes, and booking style.
- Car detail with gallery, availability preview, booking widget, and host messaging entry.
- Favorites and listing view tracking.
- Booking lifecycle: hold -> pay (Paystack) -> awaiting_host/confirmed -> review/dispute.
- Host portal: listing CRUD, photos, availability blocks, booking decisions, performance metrics.
- Admin portal: host approvals, listing moderation, refunds, review moderation, disputes, office messaging, filter catalog management.

## Product modules

### Renter side
- `Home`: marketing, hero search, featured listings, trust signals.
- `Explore`: listing feed + advanced filters + sorting.
- `Filters`: region/city, type, brand/model, fuel, transmission, seats, year, price, instant book, delivery, AC, rating, host type, features.
- `Car page`: gallery, details, availability, booking widget, host card, reviews, review form.
- `Messaging`: conversation creation, threads, unread behavior.
- `Favorites`: save/unsave listings and favorites views.
- `Bookings`: renter trip list, statuses, chat handoff, dispute open.
- `Payments`: Paystack checkout + server verification.
- `Reviews`: completed-trip-only review submission.
- `Profiles`: profile update, avatar upload.

### Host side
- `Host dashboard`: KPIs, urgent requests, conversion/earnings snapshot.
- `Car listing`: create/edit/delete listing with pricing, features, policies, photos.
- `Booking management`: approve/reject paid requests, guest messaging.
- `Earnings`: dashboard-level real metrics + separate earnings page (currently sample payout view).
- `Analytics`: listing views, favorites counts, conversion indicators.
- `Reviews`: host-facing review table.

### Platform admin
- `Moderation`: host application review and listing approval/rejection.
- `Dispute handling`: status/note updates for open disputes.
- `Payouts/refunds`: refund control for paid bookings (Paystack refund path).
- `Support`: admin office messaging console and user profile edit pages.
