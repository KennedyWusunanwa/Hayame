"use client";

import { useEffect } from "react";

type Props = {
  carId: string;
};

export function ListingViewTracker({ carId }: Props) {
  useEffect(() => {
    if (!carId) return;
    const key = `car-viewed:${carId}`;
    if (sessionStorage.getItem(key)) return;

    const sessionKey = (() => {
      const existing = localStorage.getItem("hayame_session_key");
      if (existing) return existing;
      const generated = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      localStorage.setItem("hayame_session_key", generated);
      return generated;
    })();

    fetch("/api/listing-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carId, sessionKey }),
    }).catch(() => {});

    sessionStorage.setItem(key, "1");
  }, [carId]);

  return null;
}
