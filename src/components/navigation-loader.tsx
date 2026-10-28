"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Slim progress bar along the top edge while a navigation is in flight.
 *
 * Deliberately quiet: it only appears if the next page hasn't arrived within
 * SHOW_DELAY_MS, so prefetched (near-instant) navigations show nothing at all
 * and the old page simply becomes the new one. Slow navigations get a bar that
 * eases towards 85%, then runs to 100% and fades the moment the route changes.
 * This replaces the old full-screen skeleton overlay, which flashed a fake page
 * over every click.
 */
const SHOW_DELAY_MS = 150;
const HIDE_TIMEOUT_MS = 8000;
const FINISH_MS = 260;

type Phase = "idle" | "pending" | "visible" | "finishing";

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

export function NavigationLoader() {
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const showTimer = useRef<number | null>(null);
  const safetyTimer = useRef<number | null>(null);
  const finishTimer = useRef<number | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setPhaseSafe = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  const clearTimers = () => {
    for (const ref of [showTimer, safetyTimer, finishTimer]) {
      if (ref.current) {
        window.clearTimeout(ref.current);
        ref.current = null;
      }
    }
  };

  const finish = () => {
    clearTimers();
    if (phaseRef.current === "visible") {
      // Run the bar to the end, then let it fade before unmounting.
      setPhaseSafe("finishing");
      finishTimer.current = window.setTimeout(
        () => setPhaseSafe("idle"),
        FINISH_MS + 200,
      );
    } else {
      setPhaseSafe("idle");
    }
  };

  const start = () => {
    clearTimers();
    setPhaseSafe("pending");
    showTimer.current = window.setTimeout(() => {
      if (phaseRef.current === "pending") setPhaseSafe("visible");
    }, SHOW_DELAY_MS);
    safetyTimer.current = window.setTimeout(finish, HIDE_TIMEOUT_MS);
  };

  // The route changed: whatever we were showing is done.
  useEffect(() => {
    if (phaseRef.current === "idle") return;
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedEvent(event)) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor || !shouldTrackAnchor(anchor)) return;
      start();
    };
    const handleSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form || form.hasAttribute("data-no-loading")) return;
      start();
    };
    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "idle" || phase === "pending") return null;

  return (
    <div
      className={`nav-progress ${phase === "finishing" ? "is-finishing" : "is-active"}`}
      role="progressbar"
      aria-label="Loading page"
      aria-busy={phase !== "finishing"}
    >
      <div className="nav-progress__bar" />
    </div>
  );
}
