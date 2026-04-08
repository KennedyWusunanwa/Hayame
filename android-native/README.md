# Hayame Native Android

This folder contains the native Android client (Jetpack Compose) for Hayame.

## Stack

- Kotlin + Jetpack Compose
- Navigation Compose
- Retrofit + OkHttp + Kotlinx Serialization
- DataStore (session/token persistence)
- Firebase Cloud Messaging (receive + foreground/background notification rendering)

## Configure

Set these Gradle properties (for example in `~/.gradle/gradle.properties` or project `gradle.properties`):

- `HAYAME_API_BASE_URL`
- `HAYAME_SUPABASE_URL`
- `HAYAME_SUPABASE_ANON_KEY`
- `HAYAME_SUPABASE_STORAGE_BUCKET` (optional, default `car-photos`)
- `HAYAME_SUPABASE_HOST_ID_BUCKET` (optional, default `host-ids`)

## Run

1. Open `android-native` in Android Studio.
2. Use JDK 17 for Gradle sync and command-line builds.
3. Add `google-services.json` for FCM token provisioning.
4. Build and run on device/emulator.

## Notes

- API contracts are aligned to current Hayame routes under `/api/*`.
- Booking flow uses hold -> Paystack initiate -> finalize.
- Push registration uses `/api/mobile/push/register` with `platform = android`.
- Server-side push dispatch supports both APNs and FCM in `src/lib/push.ts`.
