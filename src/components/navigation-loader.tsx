"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NavigationSkeletonOverlay } from "@/components/skeletons/page-loading-skeletons";

const HIDE_TIMEOUT_MS = 8000;

function isModifiedEvent(event: MouseEvent) {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

function shouldTrackAnchor(anchor: HTMLAnchorElement) {
  if (anchor.hasAttribute("data-no-loading")) return false;
  if (anchor.hasAttribute("download")) return false;
  if (anchor.getAttribute("target") === "_blank") return false;
  if (anchor.getAttribute("aria-disabled") === "true") return false;

  const href = anchor.getAttribute("href") ?? "";
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return false;
  }

  try {
    const currentUrl = new URL(window.location.href);
    const targetUrl = new URL(anchor.href, currentUrl);
    if (targetUrl.origin !== currentUrl.origin) return false;

    return !(
      targetUrl.pathname === currentUrl.pathname &&
      targetUrl.search === currentUrl.search
    );
  } catch {
    return false;
  }
}

function targetPathFromAnchor(anchor: HTMLAnchorElement) {
  try {
    return new URL(anchor.href, window.location.href).pathname;
  } catch {
    return null;
  }
}

export function NavigationLoader() {
  const [loading, setLoading] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setLoading(false);
      setTargetPath(null);
    }, HIDE_TIMEOUT_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [loading]);

  useEffect(() => {
    if (!loading) return;

    const frame = window.requestAnimationFrame(() => {
      setLoading(false);
      setTargetPath(null);
    });
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

      setTargetPath(targetPathFromAnchor(anchor));
      setLoading(true);
    };

    const handleSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form) return;
      if (form.hasAttribute("data-no-loading")) return;

      setLoading(true);
      setTargetPath(null);
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, []);

  if (!loading) return null;

  return <NavigationSkeletonOverlay path={targetPath} />;
}
