import { NextResponse } from "next/server";

// Enables Android App Links: tapping a hayamegh.com/cars/* link opens the
// Hayame app directly (if installed) instead of the browser. Android fetches
// this file over HTTPS and verifies it against the APK's signing
// certificate before granting auto-verified link handling.
//
// TODO: replace with the real release-signing SHA-256 certificate
// fingerprint before this takes effect (Play Console → Setup → App
// integrity → App signing key certificate, or `keytool -list -v -keystore
// <release-key>.jks`). Until then Android will still offer "Open with
// Hayame" as a manual chooser option, it just won't auto-verify.
const ASSET_LINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.hayame.app",
      sha256_cert_fingerprints: [
        "REPLACE_WITH_RELEASE_SIGNING_SHA256_FINGERPRINT",
      ],
    },
  },
];

export async function GET() {
  return NextResponse.json(ASSET_LINKS, {
    headers: { "Content-Type": "application/json" },
  });
}
