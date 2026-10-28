"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Gives each page one calm entrance. Keyed by pathname so the wrapper remounts
 * on navigation, and the CSS (`.page-transition > *` in globals.css) fades and
 * lifts whatever mounts inside it — the route's loading skeleton first, then
 * the real page when it replaces the skeleton — as a single motion rather than
 * section-by-section. Respects prefers-reduced-motion via the same CSS.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
