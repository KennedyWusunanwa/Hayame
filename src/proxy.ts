import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminSessionToken } from "@/lib/admin-auth/config";
import { getMaintenanceSettings } from "@/lib/maintenance";
import { isMaintenanceActive } from "@/lib/maintenance-core";

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
  if (!isMaintenanceActive(settings)) return NextResponse.next();

  // A signed-in admin sees the real site.
  if (isValidAdminSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.next();
  }

  const retryAfter =
    settings?.mode === "timed" && settings.endsAt
      ? Math.max(60, Math.ceil((Date.parse(settings.endsAt) - Date.now()) / 1000))
      : 3600;
  const target = request.nextUrl.clone();
  target.pathname = "/maintenance";
  target.search = "";
  const response = NextResponse.rewrite(target, { status: 503 });
  response.headers.set("Retry-After", String(retryAfter));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
