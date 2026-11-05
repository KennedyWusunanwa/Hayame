# Hayame app icon

One icon for both apps: the car mark alone, centred at 80% of the tile width at its native aspect
ratio, on a deep glossy blue (#1E7FE8 → #0B4CC6 → #051C6E with a glass sheen across the top). The car has a
white-to-ice gradient, a specular highlight, a soft halo and a faint floor reflection. Everything is
generated from the master logo in `public/logo-white.png` by `make-icons.swift`, so the two platforms
never drift apart.

## What ships where

| Platform | Asset | Notes |
| --- | --- | --- |
| iOS 26+ | `HayameIOS/HayameIOS/AppIcon.icon` | Icon Composer package: gradient fill plus the `car` glass layer over a `glow` + `sheen` group. iOS renders it in Liquid Glass and derives the dark, clear and tinted appearances itself. |
| iOS 17/18 | `HayameIOS/HayameIOS/Assets.xcassets/AppIcon.appiconset` | Glossy fallback at every required size, same composition. |
| Android 8+ | `android-native/.../mipmap-*/ic_launcher_foreground.png`, `_monochrome.png`, `drawable/ic_launcher_background.xml` | Adaptive icon: gradient background drawable, glossy car foreground sized for the 66 dp safe zone, monochrome layer for themed icons (Android 13+). |
| Android (legacy) | `mipmap-*/ic_launcher.png`, `ic_launcher_round.png` | Not used on minSdk 26 devices, regenerated for consistency. |
| Stores | `app-store-1024.png`, `play-store-512.png` | Full-bleed marketing icons. |

`preview-android-round.png` shows how a round-mask launcher crops the adaptive icon.

## Alternate "Name" icon

Settings > Appearance > App icon lets users switch between the logo and the HAYAME wordmark. The
generator also emits that second icon:

| Platform | Asset |
| --- | --- |
| iOS 26+ | `HayameIOS/HayameIOS/AppIconWordmark.icon` (wired via `ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES`) |
| iOS 17/18 | `Assets.xcassets/AppIconWordmark.appiconset` |
| iOS picker previews | `Assets.xcassets/AppIconPreviewLogo.imageset`, `AppIconPreviewWordmark.imageset` |
| Android | `mipmap-*/ic_launcher_wordmark*.png`, `mipmap-anydpi-v26/ic_launcher_wordmark*.xml`, picker previews in `drawable-nodpi/app_icon_preview_*.png` |

On iOS the switch goes through `UIApplication.setAlternateIconName` (`App/AppIconManager.swift`). On
Android it toggles the `LauncherLogo` / `LauncherWordmark` activity aliases declared in the manifest
(`core/AppIconManager.kt`); launchers refresh the drawer icon on their own and may rebuild home-screen
shortcuts when they do.

## Regenerate

```sh
swiftc -O -o /tmp/make-icons design/icons/make-icons.swift
/tmp/make-icons "$(pwd)"
```

Then rebuild both apps. To tweak the composition edit the `fraction` / `adaptiveFraction` values in
`make-icons.swift` (car width as a share of the tile) or the colours and gloss stops in
`fillGlossyBackground` and `drawGlossyCar`. Open `AppIcon.icon` in Icon Composer (bundled with Xcode 26) to adjust
glass settings such as translucency, specular and shadow per layer.
