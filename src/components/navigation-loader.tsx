"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const HIDE_TIMEOUT_MS = 8000;

export function NavigationLoader() {
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setLoading(false), HIDE_TIMEOUT_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [loading]);

  useEffect(() => {
    if (loading) setLoading(false);
  }, [pathname, searchParams, loading]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (anchor) {
        const href = anchor.getAttribute("href") ?? "";
        const isExternal =
          href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
        const isHash = href.startsWith("#");
        const noLoading = anchor.hasAttribute("data-no-loading");
        if (!isExternal && !isHash && !noLoading) {
          setLoading(true);
        }
        return;
      }
      const button = target.closest("button") as HTMLButtonElement | null;
      if (button) {
        if (button.hasAttribute("data-no-loading")) return;
        const type = (button.getAttribute("type") || "submit").toLowerCase();
        if (type === "submit") setLoading(true);
      }
    };

    const handleSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form) return;
      if (form.hasAttribute("data-no-loading")) return;
      setLoading(true);
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="loading-overlay" aria-live="polite" aria-busy="true">
      <div className="loading-spinner" aria-label="Loading" />
    </div>
  );
}
