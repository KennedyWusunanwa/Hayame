import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/admin-auth/config";
import { getMaintenanceSettings } from "@/lib/maintenance";
import { isMaintenanceActive } from "@/lib/maintenance-core";
import { renderMaintenanceHtml } from "@/lib/maintenance-html";

// Lets the public site show admins an "everyone else sees maintenance" indicator.
const ADMIN_FLAG_COOKIE = "hayame_maint_admin";

// Always reachable, even in maintenance: the admin portal (to switch it off),
// the maintenance page itself, and API routes (payment webhooks, mobile apps).
const EXEMPT_PREFIXES = ["/admin", "/api", "/maintenance", "/.well-known"];
const EXEMPT_EXACT = new Set([
  "/robots.txt",
  "/sitemap.xml",
  "/site.webmanifest",
  "/opengraph-image",
  "/twitter-image",
]);
const STATIC_FILE = /\.(?:png|jpe?g|webp|avif|svg|gif|ico|css|js|map|woff2?|ttf|txt|xml|json|webmanifest|apk|mp4|pdf)$/i;

function isExempt(pathname: string) {
  if (EXEMPT_EXACT.has(pathname) || STATIC_FILE.test(pathname)) return true;
  return EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  if (isExempt(request.nextUrl.pathname)) return NextResponse.next();

  const settings = await getMaintenanceSettings();
  const active = isMaintenanceActive(settings);
  if (!active) {
    const response = NextResponse.next();
    if (request.cookies.has(ADMIN_FLAG_COOKIE)) response.cookies.delete(ADMIN_FLAG_COOKIE);
    return response;
  }

  // A signed-in admin sees the real site, plus a small "maintenance is ON" indicator.
  if (isValidAdminSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    const response = NextResponse.next();
    response.cookies.set(ADMIN_FLAG_COOKIE, settings?.mode === "timed" && settings.endsAt ? settings.endsAt : "indefinite", {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      maxAge: 60 * 60 * 12,
    });
    return response;
  }

  const retryAfter =
    settings?.mode === "timed" && settings.endsAt
      ? Math.max(60, Math.ceil((Date.parse(settings.endsAt) - Date.now()) / 1000))
      : 3600;
  // Plain HTML, not an app route: nothing from the site layout can flash first.
  return new NextResponse(renderMaintenanceHtml(settings!), {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Retry-After": String(retryAfter),
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
