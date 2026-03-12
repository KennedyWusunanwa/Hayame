"use client";

import { useEffect } from "react";

const MOBILE_USER_AGENT_PATTERN =
  /android|iphone|ipad|ipod|iemobile|opera mini|mobile/i;
const BOT_USER_AGENT_PATTERN = /bot|crawler|spider|crawling/i;
const PRODUCTION_HOSTS = new Set(["www.hayamegh.com", "hayamegh.com"]);
const REDIRECT_SESSION_KEY = "hayame.mobile_app_redirect_attempted";

export function MobileAppRedirect() {
  useEffect(() => {
    const currentURL = new URL(window.location.href);
    const hostname = currentURL.hostname.toLowerCase();

    if (!PRODUCTION_HOSTS.has(hostname)) return;
    if (currentURL.searchParams.get("web") === "1") return;

    const userAgent = navigator.userAgent ?? "";
    if (!MOBILE_USER_AGENT_PATTERN.test(userAgent)) return;
    if (BOT_USER_AGENT_PATTERN.test(userAgent)) return;

    try {
      if (window.sessionStorage.getItem(REDIRECT_SESSION_KEY) === "1") return;
      window.sessionStorage.setItem(REDIRECT_SESSION_KEY, "1");
    } catch {
      // Continue without session guard if storage access is blocked.
    }

    const deepLink = `hayame://open?src=web&path=${encodeURIComponent(
      currentURL.pathname + currentURL.search
    )}`;
    window.location.replace(deepLink);
  }, []);

  return null;
}
