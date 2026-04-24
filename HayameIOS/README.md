# Hayame iOS App

Native iOS app for Hayame (Ghana car sharing marketplace), built with SwiftUI.

## Requirements

- Xcode 17+
- iOS 17+ simulator/device target
- Apple Developer signing team for APNs on real devices

## Open in Xcode

1. Open `HayameIOS.xcodeproj`
2. Select scheme: `Hayame`
3. Build/run on simulator or device

## Configure API

Set API values in `HayameIOS/Info.plist`:

- `HAYAMEAPIBaseURL`
- `HAYAMESupabaseURL`
- `HAYAMESupabaseAnonKey`

Default production API base URL is `https://www.hayamegh.com`.

## Push Notifications

- APNs is configured through:
  - `HayameIOS/HayameIOS.Debug.entitlements`
  - `HayameIOS/HayameIOS.Release.entitlements`
- Real remote push delivery requires:
  - a valid Apple signing team in Xcode
  - Push Notifications capability enabled for the app identifier
  - APNs server env vars on the web backend (`APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY`, `APNS_TOPIC`)
- The iOS app now:
  - registers and unregisters device tokens with the backend
  - routes notification taps into messages or bookings
  - suppresses local polling duplicates once remote delivery is active

## Features

- Auth (login/signup/guest)
- Explore and car detail
- Favorites, trips, dashboard
- Host flows (listings, bookings, profile)
- Messaging and unread indicators
- Push registration, remote notification routing, and local fallback hooks

## Build (CLI)

```bash
xcodebuild -scheme Hayame -destination 'generic/platform=iOS Simulator' build
```
