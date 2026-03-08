"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const HIDE_TIMEOUT_MS = 8000;

function isModifiedEvent(event: MouseEvent) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function shouldTrackAnchor(anchor: HTMLAnchorElement) {
  if (anchor.hasAttribute("data-no-loading")) return false;
  if (anchor.hasAttribute("download")) return false;
  if (anchor.getAttribute("target") === "_blank") return false;
  if (anchor.getAttribute("aria-disabled") === "true") return false;

  const href = anchor.getAttribute("href") ?? "";
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }

  try {
    const currentUrl = new URL(window.location.href);
    const targetUrl = new URL(anchor.href, currentUrl);
    if (targetUrl.origin !== currentUrl.origin) return false;

    return !(targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search);
  } catch {
    return false;
  }
}

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
    if (!loading) return;

    const frame = window.requestAnimationFrame(() => setLoading(false));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, searchParams, loading]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (isModifiedEvent(event)) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor || !shouldTrackAnchor(anchor)) return;

      setLoading(true);
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
