"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the site navbar/footer (and consent banner) on the auth and admin routes.
 *
 * The sign in and sign up screens are a full-bleed split layout with their own
 * "Back to Hayame" affordance; the global chrome would compete with the brand
 * panel and squeeze the form on small screens.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hidden = ["/auth", "/admin", "/maintenance"].some((prefix) => pathname?.startsWith(prefix));
  if (hidden) return null;
  return <div data-site-chrome className="contents">{children}</div>;
}
