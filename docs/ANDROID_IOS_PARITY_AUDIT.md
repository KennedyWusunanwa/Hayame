# Android vs iOS Parity Audit

Date: 2026-03-19
Reference baseline: `HayameIOS/HayameIOS/**`
Android target: `android-native/app/src/main/**`

## 1) iOS screen inventory vs Android

### iOS screen-by-screen status
- `AuthFlowScreen`: Partial (Android has login/signup + guest mode, but not identical segmented auth container UX).
- `RenterTabShell`: Partial (Android renter tabs exist, but role-routing behavior differs).
- `RenterHomeScreen`: Partial.
- `ExploreScreen`: Partial (core list works; advanced filter parity missing).
- `CarDetailScreen`: Partial (core flow works; gallery/availability/review parity missing).
- `TripsScreen`: Partial (core bookings shown; layout/interaction parity missing).
- `FavoritesScreen`: Partial.
- `InboxScreen`: Partial.
- `ChatThreadScreen`: Partial.
- `GuestProfileScreen`: Partial (Android More/Profile differs structurally).
- `RenterDashboardScreen`: Implemented in this pass (still not exact iOS UX parity).
- `BecomeHostScreen`: Partial (face-photo and some validation/status parity missing).
- `HostApplicationPendingScreen`: Implemented in this pass.
- `HostTabShell`: Implemented in this pass (Android host shell with Dashboard/Cars/Bookings/Earnings/Inbox/Profile tabs).
- `HostDashboardScreen`: Partial.
- `HostCarsScreen`: Partial.
- `ListingEditorScreen`: Partial (field-level parity gaps remain).
- `HostListingPhotosScreen`: Implemented in this pass.
- `HostAvailabilityEditorScreen`: Implemented in this pass.
- `HostBookingsScreen`: Partial.
- `HostEarningsScreen`: Partial.
- `HostFavoritesScreen`: Implemented in this pass.
- `HostReviewsScreen`: Partial.
- `HostProfileScreen`: Partial (now includes additional links).
- `ContactScreen`: Implemented in this pass.
- `PrivacyScreen`: Implemented in this pass.
- `ProtectionScreen`: Implemented in this pass.
- `CancellationPolicyScreen`: Implemented in this pass.
- `MarketingPagesListScreen`: Implemented in this pass.
- `MarketingWebPageScreen`: Implemented via external open in this pass.
- `HostPublicProfileScreen`: Missing.
- `AdminShellScreen` + `Admin*` screens: Missing.

### Implemented on Android in this pass
- Auth and app shell:
  - Splash, Login, Signup
  - Guest mode entry from Login
  - Main renter shell (Home, Explore, Trips, Saved, More)
  - Renter Dashboard route
- Messaging:
  - Messages list
  - Conversation thread
- Booking flow:
  - Car detail
  - Booking checkout + Paystack initiate/finalize
- Host lifecycle:
  - Become Host
  - Host Application Pending screen
  - Host Dashboard
  - Host Cars
  - Host Car editor
  - Host Listing Photos manager (new)
  - Host Availability editor (new)
  - Host Bookings
  - Host Earnings
  - Host Favorites analytics (new)
  - Host Reviews
  - Host Profile
- Legal/support:
  - Support hub
  - Contact (new)
  - Privacy (new)
  - Protection (new)
  - Cancellation policy (new)
  - Marketing pages list + external open (new)

### Still missing (iOS has it, Android missing or materially different)
- Admin area:
  - `AdminShellScreen`
  - `AdminHomeScreen`
  - `AdminPlatformScreen`
  - `AdminMessagesScreen`
  - `AdminFiltersScreen`
  - `AdminUserDetailScreen`
  - `AdminCarPreviewScreen`
- Public host profile page:
  - `HostPublicProfileScreen`
- Full host-tab parity:
  - iOS has dedicated `HostTabShell` with Inbox/Profile tabs in shell.
  - Android host flow is route-based and does not mirror tab structure exactly.

## 2) Feature parity gaps (non-screen)

### Discovery / Explore
- Missing advanced iOS filter controls in Android:
  - region/city dropdowns
  - make/model dropdown linkage
  - fuel/transmission/type pickers
  - min/max price steppers
  - instant-book, delivery, AC toggles in filter sheet
- iOS has richer sort/filter UX and summary chips.

### Car detail
- iOS has features Android still lacks:
  - full image gallery experience with fullscreen pager
  - explicit availability checker action/state
  - richer fee breakdown context in-page
  - stronger host-trust presentation (verified status treatment)
  - direct review submit flow surfaced from detail/trips context

### Trips / bookings UX
- Android Trips exists but is less complete than iOS:
  - no upcoming/past split layout parity
  - no iOS-style progress tracker and detail chips parity
  - reduced payment status and rejection/dispute presentation richness

### Profile / More
- Android More now routes to dashboard/support/profile paths, but still differs from iOS:
  - no iOS-style profile edit sheet behavior
  - no route-bridging behavior equivalent to iOS `MoreRoute` legacy mapping

### Host listing editor
- Android editor is functional but not field-complete vs iOS editor:
  - missing several iOS pricing/fee controls and policy depth in one form
  - no local draft persistence/restore
  - reduced make/model/location picker parity and validation behavior

### Host application
- Android supports host application + ID front/back upload, but iOS currently includes additional face-photo upload flow and more granular status messaging.

### Messaging behavior
- Android has list/thread, but iOS has more realtime/pending-draft handling and unread update behaviors.

### Notification/UI parity
- Visual system is close in color palette, but not all page structures and micro-interactions match iOS yet.

## 3) What I changed now (code)

- Added guest mode support in Android state/navigation.
- Added floating modern bottom nav bars for renter and host shells.
- Added new Android routes/screens:
  - renter dashboard
  - host pending
  - host shell (tabbed host mode)
  - host favorites
  - host listing photos
  - host availability editor
  - contact/privacy/protection/cancellation/marketing pages
- Wired new navigation targets and callbacks.
- Expanded host cars/profile/support pages to expose new routes.

## 4) Recommended next implementation order (for full parity)

1. Build Admin shell/screens parity.
2. Implement public host profile screen + car detail link-out.
3. Upgrade Explore to iOS filter-sheet parity.
4. Upgrade Trips and Car Detail to iOS UI/interaction parity.
5. Expand Host listing editor fields + draft persistence to match iOS behavior.
6. Add remaining realtime messaging parity behaviors.
