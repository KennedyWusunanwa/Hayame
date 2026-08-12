import { NextResponse } from "next/server";

// Enables iOS Universal Links: tapping a hayamegh.com/cars/* link opens the
// Hayame app directly (if installed) instead of Safari. iOS fetches this
// file over HTTPS at install time and caches it — no redirects allowed, and
// it must be reachable without auth. Team ID + bundle ID come from
// HayameIOS/project.yml (DEVELOPMENT_TEAM / PRODUCT_BUNDLE_IDENTIFIER).
const APPLE_APP_SITE_ASSOCIATION = {
  applinks: {
    apps: [],
    details: [
      {
        appID: "XJHSMVRVW4.com.hayame.app",
        paths: ["/cars/*"],
      },
    ],
  },
};

export async function GET() {
  return NextResponse.json(APPLE_APP_SITE_ASSOCIATION, {
    headers: { "Content-Type": "application/json" },
  });
}
