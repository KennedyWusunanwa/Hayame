#!/usr/bin/env bash
set -euo pipefail

# Captures one screenshot per renter route, in both light and dark mode, with
# REAL live listing photos (pulled from production) rendered in every image
# slot. The app runs in a DEBUG "screenshot mode" (see ScreenshotRootView.swift
# + AppState.configureForScreenshots) that:
#   - authenticates a demo guest,
#   - fetches live cars that actually have photos,
#   - and BLOCKS each route behind a loading overlay until those photos are
#     decoded into the in-memory cache (AppState.warmScreenshotImages).
#
# A warm-up launch downloads every listing image into the app's on-disk URL
# cache first; because we install the app only once, that disk cache persists
# across every route and both appearances, so captures render instantly.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_PATH="$ROOT_DIR/HayameIOS/HayameIOS.xcodeproj"
SCHEME="${SCHEME:-Hayame}"
DEVICE_NAME="${DEVICE_NAME:-iPhone 17 Pro}"
BUNDLE_ID="${BUNDLE_ID:-com.hayame.app}"
DERIVED_DATA="$ROOT_DIR/screenshots/.derived-data"
OUTPUT_DIR="$ROOT_DIR/screenshots/ios-mobile"
APP_PATH="$DERIVED_DATA/Build/Products/Debug-iphonesimulator/Hayame.app"
THEMES="${THEMES:-light dark}"

routes=(
  "01-splash:splash"
  "02-auth-login:auth-login"
  "03-auth-signup:auth-signup"
  "04-home:home"
  "05-explore:explore"
  "06-explore-filters:explore-filters"
  "07-car-detail:car-detail"
  "08-booking-trip:booking-trip"
  "09-booking-calendar:booking-calendar"
  "10-booking-location:booking-location"
  "11-booking-review:booking-review"
  "12-booking-payment:booking-payment"
  "13-payment-processing:payment-processing"
  "14-trips:trips"
  "15-favorites:favorites"
  "16-messages:messages"
  "17-profile:profile"
  "18-renter-dashboard:renter-dashboard"
)

device_udid() {
  xcrun simctl list devices available | awk -v name="$DEVICE_NAME" '
    index($0, name " (") {
      split($0, parts, "(")
      split(parts[2], id_parts, ")")
      print id_parts[1]
      exit
    }
  '
}

# Routes that go through ScreenshotRenterRouteView sit behind a "Loading live
# car listings" overlay until the live API fetch + blocking image warm finish.
# That overlay renders as a tiny (~90 KB) near-white PNG, whereas a fully
# rendered screen with real photos is always 250 KB+. We exploit that gap to
# detect "still loading" and retry, instead of guessing a fixed sleep.
MIN_IMAGE_BYTES="${MIN_IMAGE_BYTES:-250000}"

# Initial settle (seconds) after launch, before the first screenshot attempt.
capture_delay() {
  case "$1" in
    splash) printf "3.0" ;;
    auth-login|auth-signup) printf "2.5" ;;
    explore-filters|booking-calendar|messages|profile|renter-dashboard) printf "20.0" ;;
    home|explore|car-detail|booking-trip|booking-location|booking-review|booking-payment|payment-processing|trips|favorites) printf "16.0" ;;
    *) printf "8.0" ;;
  esac
}

# Image-content routes: their rendered screen always exceeds MIN_IMAGE_BYTES,
# so a small capture means the overlay is still up — retry with more time.
is_image_route() {
  case "$1" in
    home|explore|car-detail|booking-trip|booking-location|booking-review|booking-payment|payment-processing|trips|favorites) return 0 ;;
    *) return 1 ;;
  esac
}

launch_route() {
  # $1 = route slug, $2 = theme
  xcrun simctl terminate "$UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
  xcrun simctl launch "$UDID" "$BUNDLE_ID" \
    -HAYAME_SCREENSHOT_ROUTE "$1" \
    -HAYAME_SCREENSHOT_THEME "$2" >/dev/null
}

file_size() {
  stat -f%z "$1" 2>/dev/null || echo 0
}

# Capture a route, retrying image routes (with growing waits) until the PNG is
# big enough to be a real rendered screen rather than the loading overlay.
capture_route() {
  local route="$1" theme="$2" output="$3"
  local extra_waits=(0 8 12 18)
  local attempt size

  launch_route "$route" "$theme"
  sleep "$(capture_delay "$route")"
  xcrun simctl io "$UDID" screenshot "$output" >/dev/null

  if ! is_image_route "$route"; then
    echo "  $theme/$(basename "$output")"
    return 0
  fi

  for attempt in "${extra_waits[@]}"; do
    size="$(file_size "$output")"
    if (( size >= MIN_IMAGE_BYTES )); then
      echo "  $theme/$(basename "$output") (${size} bytes)"
      return 0
    fi
    if (( attempt == 0 )); then continue; fi
    echo "    re-capturing $route (size ${size} < ${MIN_IMAGE_BYTES}, +${attempt}s)"
    sleep "$attempt"
    xcrun simctl io "$UDID" screenshot "$output" >/dev/null
  done

  size="$(file_size "$output")"
  echo "  $theme/$(basename "$output") (${size} bytes, best effort)"
}

echo "Building $SCHEME for $DEVICE_NAME..."
xcodebuild \
  -project "$PROJECT_PATH" \
  -scheme "$SCHEME" \
  -destination "platform=iOS Simulator,name=$DEVICE_NAME" \
  -configuration Debug \
  -derivedDataPath "$DERIVED_DATA" \
  -quiet \
  build

if [[ ! -d "$APP_PATH" ]]; then
  echo "Built app not found at $APP_PATH" >&2
  exit 1
fi

UDID="${SIMULATOR_UDID:-$(device_udid)}"
if [[ -z "$UDID" ]]; then
  echo "No available simulator found for '$DEVICE_NAME'." >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/screenshots"
rm -rf "$OUTPUT_DIR"
for theme in $THEMES; do
  mkdir -p "$OUTPUT_DIR/$theme"
done

echo "Booting simulator $DEVICE_NAME ($UDID)..."
xcrun simctl boot "$UDID" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$UDID" -b >/dev/null

# Install ONCE so the on-disk image cache persists across every launch below.
echo "Installing app..."
xcrun simctl uninstall "$UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
xcrun simctl install "$UDID" "$APP_PATH"

# Warm-up: each route's warm step downloads every listing photo (list + detail
# + booking sizes) into the persistent disk cache. Run the heavy routes a couple
# of times so the cold download fully completes AND the disk-cache writes flush
# before the real captures begin.
echo "Warming live listing image cache (downloading real photos)..."
launch_route "home" "light"
sleep 55
launch_route "explore" "light"
sleep 25
launch_route "car-detail" "light"
sleep 25
xcrun simctl terminate "$UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true

for theme in $THEMES; do
  echo "Capturing $theme mode..."
  xcrun simctl ui "$UDID" appearance "$theme" >/dev/null

  for entry in "${routes[@]}"; do
    slug="${entry%%:*}"
    route="${entry#*:}"
    output="$OUTPUT_DIR/$theme/$slug.png"
    capture_route "$route" "$theme" "$output"
  done
done

xcrun simctl terminate "$UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
rm -rf "$DERIVED_DATA"
echo "Screenshots saved to $OUTPUT_DIR"
