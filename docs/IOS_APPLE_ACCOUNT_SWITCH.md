# iOS Apple Account Switch

This checklist covers moving the Hayame iOS app to a recipient Apple Developer
account and keeping push notifications working.

## Transfer vs new app

For an App Store Connect transfer, keep the bundle ID unchanged:

- App name: `Hayame`
- Bundle ID / APNs topic: `com.hayame.app`
- URL schemes: `hayame`, `hayameios`

Apple transfers the associated App ID to the recipient developer account after
the recipient accepts the app transfer. Do not change
`PRODUCT_BUNDLE_IDENTIFIER` if the goal is to keep the existing App Store app,
ratings, reviews, users, and updates.

Only change the bundle ID if you are abandoning the transferred app and creating
a brand-new App Store app record. That creates a different installed app from
Apple's perspective.

## Local files that contain Apple account IDs

- `HayameIOS/HayameIOS.xcodeproj/project.pbxproj`
  - `DEVELOPMENT_TEAM` must be the recipient Apple Team ID for Debug and
    Release target build settings.
  - `PRODUCT_BUNDLE_IDENTIFIER` should remain `com.hayame.app` for a transfer.
- `HayameIOS/project.yml`
  - Keep this in sync if the Xcode project is regenerated from XcodeGen.
- `HayameIOS/HayameIOS/HayameIOS.Debug.entitlements`
  - `aps-environment` is `development`.
- `HayameIOS/HayameIOS/HayameIOS.Release.entitlements`
  - `aps-environment` is `production`.
- Backend environment variables
  - `APNS_TEAM_ID`
  - `APNS_KEY_ID`
  - `APNS_PRIVATE_KEY`
  - `APNS_TOPIC`
  - `APNS_USE_SANDBOX`

## Xcode signing steps

1. Accept the app transfer in App Store Connect.
2. Sign in to Xcode with the recipient Apple Developer account.
3. Open `HayameIOS/HayameIOS.xcodeproj`.
4. Select the `HayameIOS` target, then Signing & Capabilities.
5. Select the recipient team.
6. Confirm Bundle Identifier is still `com.hayame.app`.
7. Confirm Push Notifications is enabled for the App ID in Certificates,
   Identifiers & Profiles.
8. Confirm Background Modes includes Remote notifications.
9. Let Xcode regenerate provisioning profiles, or create new development and
   distribution provisioning profiles in the recipient account.
10. Build on a real device and confirm APNs registration succeeds.

If the recipient team ID is different from the current project value, update all
target-level `DEVELOPMENT_TEAM` values in the Xcode project and mirror the value
in `HayameIOS/project.yml` before regenerating the project.

## Backend APNs steps

Create or choose an APNs authentication key in the recipient Apple Developer
account, then set these production environment variables on the web backend:

```env
APNS_TEAM_ID=<recipient_apple_team_id>
APNS_KEY_ID=<recipient_apns_key_id>
APNS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
APNS_TOPIC=com.hayame.app
APNS_USE_SANDBOX=false
```

Use `APNS_USE_SANDBOX=true` only for development builds signed with the
development `aps-environment` entitlement.

After changing APNs credentials, redeploy the backend. The iOS app re-uploads
its APNs device token after login and during authenticated sync/polling, and the
backend removes invalid tokens when APNs reports that they are stale.

## Keychain impact

The iOS app stores saved biometric login credentials in Keychain under the
service `com.hayame.app.biometric-login`. If the Apple Team ID / app identifier
prefix changes, existing Keychain items may not be readable by the first build
signed by the recipient team. Users may need to log in once and re-enable saved
biometric login.

## Final verification

- Archive a Release build with the recipient team selected.
- Upload the archive to the transferred App Store Connect app.
- Install a TestFlight build on a real device.
- Log in, allow notifications, and confirm the backend records an iOS token.
- Send a direct push from the admin platform and confirm delivery.
