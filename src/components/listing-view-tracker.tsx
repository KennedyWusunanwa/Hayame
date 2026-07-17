"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/client";
import { hasAnalyticsConsent } from "@/lib/analytics/consent";

type Props = {
  carId: string;
  region?: string | null;
  priceBucket?: string | null;
};

/**
 * Records that a listing was viewed.
 *
 * Two destinations, on purpose:
 *   * `listing_views` — the per-day deduped count hosts see on their dashboard.
 *     Hosts rely on this being a stable "how many people looked at my car
 *     today" number, so it keeps its own daily-unique semantics.
 *   * `analytics_events` — the raw event, which is what makes funnel analysis
 *     possible (search -> view -> booking).
 *
 * Both are now gated on analytics consent. Before this, the session key was
 * written to localStorage on every listing view regardless of choice.
 */
export function ListingViewTracker({ carId, region, priceBucket }: Props) {
  useEffect(() => {
    if (!carId) return;

    track("car_view", {
      car_id: carId,
      region: region ?? null,
      price_bucket: priceBucket ?? null,
    });

    if (!hasAnalyticsConsent()) return;

    const key = `car-viewed:${carId}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      return;
    }

    const sessionKey = (() => {
      try {
        const existing = localStorage.getItem("hayame_session_key");
        if (existing) return existing;
        const generated = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
        localStorage.setItem("hayame_session_key", generated);
        return generated;
      } catch {
        return null;
      }
    })();

    fetch("/api/listing-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carId, sessionKey }),
    }).catch(() => {});

    try {
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage unavailable; the view is already recorded server-side.
    }
  }, [carId, region, priceBucket]);

  return null;
}
