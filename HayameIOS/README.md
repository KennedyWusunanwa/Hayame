# Hayame iOS App

Native iOS app for Hayame (Ghana car sharing marketplace), built with SwiftUI.

## Requirements

- Xcode 17+
- iOS 17+ simulator/device target

## Open in Xcode

1. Open `HayameIOS.xcodeproj`
2. Select scheme: `HayameIOS`
3. Build/run on simulator or device

## Configure API

Set API values in `HayameIOS/Info.plist`:

- `HAYAMEAPIBaseURL`
- `HAYAMESupabaseURL`
- `HAYAMESupabaseAnonKey`

Default production API base URL is `https://www.hayamegh.com`.

## Features

- Auth (login/signup/guest)
- Explore and car detail
- Favorites, trips, dashboard
- Host flows (listings, bookings, profile)
- Messaging and unread indicators
- Push registration + local notification hooks

## Build (CLI)

```bash
xcodebuild -scheme HayameIOS -destination 'generic/platform=iOS Simulator' build
```
