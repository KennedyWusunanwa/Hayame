import { NextResponse } from "next/server";

/**
 * Web app manifest for the admin console only. Its scope is /admin, so
 * "Add to Home Screen" on a phone installs just the admin dashboard as its own
 * app, separate from the public Hayame site.
 */
export function GET() {
  return NextResponse.json(
    {
      id: "/admin",
      name: "Hayame Admin",
      short_name: "Hayame Admin",
      description: "Manage Hayame: verifications, bookings, payments and users.",
      start_url: "/admin?source=pwa",
      scope: "/admin",
      display: "standalone",
      orientation: "portrait",
      background_color: "#06182E",
      theme_color: "#0A2B54",
      icons: [
        { src: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
      shortcuts: [
        { name: "Renter verification", url: "/admin/verifications" },
        { name: "Payments", url: "/admin/payments" },
        { name: "Users", url: "/admin?tab=users" },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
