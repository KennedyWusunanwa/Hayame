"use client";

import { useEffect } from "react";
import { buildWebFallbackUrl, getAppStoreFallback } from "@/lib/support";

const MOBILE_USER_AGENT_PATTERN =
  /android|iphone|ipad|ipod|iemobile|opera mini|mobile/i;
const BOT_USER_AGENT_PATTERN = /bot|crawler|spider|crawling/i;
const PRODUCTION_HOSTS = new Set(["www.hayamegh.com", "hayamegh.com"]);
const REDIRECT_SESSION_KEY = "hayame.mobile_app_redirect_attempted";
const APP_OPEN_TIMEOUT_MS = 1400;

export function MobileAppRedirect() {
  useEffect(() => {
    const currentURL = new URL(window.location.href);
    const hostname = currentURL.hostname.toLowerCase();

    if (!PRODUCTION_HOSTS.has(hostname)) return;
    if (currentURL.searchParams.get("web") === "1") return;

    const userAgent = navigator.userAgent ?? "";
    if (!MOBILE_USER_AGENT_PATTERN.test(userAgent)) return;
    if (BOT_USER_AGENT_PATTERN.test(userAgent)) return;

    const platform = /iphone|ipad|ipod/i.test(userAgent)
      ? "ios"
      : /android/i.test(userAgent)
        ? "android"
        : null;
    if (!platform) return;

    try {
      if (window.sessionStorage.getItem(REDIRECT_SESSION_KEY) === "1") return;
      window.sessionStorage.setItem(REDIRECT_SESSION_KEY, "1");
    } catch {
      // Continue without session guard if storage access is blocked.
    }

    const deepLink = `hayame://open?src=web&path=${encodeURIComponent(
      currentURL.pathname + currentURL.search,
    )}`;
    const fallbackUrl = getAppStoreFallback(platform, currentURL);
    let shouldFallback = true;

    const cancelFallback = () => {
      shouldFallback = false;
    };
    const handleVisibilityChange = () => {
      if (document.hidden) cancelFallback();
    };

    const timer = window.setTimeout(() => {
      if (!shouldFallback) return;
      window.location.replace(fallbackUrl || buildWebFallbackUrl(currentURL));
    }, APP_OPEN_TIMEOUT_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", cancelFallback);
    window.location.replace(deepLink);

    return () => {
      shouldFallback = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", cancelFallback);
    };
  }, []);

  return null;
}
