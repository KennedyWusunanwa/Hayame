"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the site navbar/footer on the auth routes.
 *
 * The sign in and sign up screens are a full-bleed split layout with their own
 * "Back to Hayame" affordance; the global chrome would compete with the brand
 * panel and squeeze the form on small screens.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/auth");
  if (isAuthRoute) return null;
  return <>{children}</>;
}
