"use client";

import { useEffect, useMemo, useState } from "react";
import { fallbackCities } from "./utils";

type Locations = Record<string, string[]>;

type UseLocationsOptions = {
  strict?: boolean;
  defer?: boolean;
};

let cachedLocations: Locations | null = null;
let cachedFallbackLocations: Locations | null = null;
let inFlightLocations: Promise<Locations> | null = null;

function fallbackLocations(): Locations {
  if (cachedFallbackLocations) return cachedFallbackLocations;
  const grouped: Locations = {};
  fallbackCities.forEach((c) => {
    if (!grouped[c.region]) grouped[c.region] = [];
    grouped[c.region].push(c.city);
  });
  cachedFallbackLocations = grouped;
  return grouped;
}

function scheduleLoad(callback: () => void, defer: boolean) {
  if (!defer) {
    callback();
    return () => {};
  }

  const idleWindow = window as Window & {
    requestIdleCallback?: (
      cb: () => void,
      options?: { timeout: number },
    ) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (idleWindow.requestIdleCallback) {
    const id = idleWindow.requestIdleCallback(callback, { timeout: 1200 });
    return () => idleWindow.cancelIdleCallback?.(id);
  }

  const timeout = window.setTimeout(callback, 350);
  return () => window.clearTimeout(timeout);
}

export function useLocations(options: UseLocationsOptions = {}) {
  const { strict = false, defer = false } = options;
  const [data, setData] = useState<Locations>(() =>
    strict ? {} : (cachedLocations ?? fallbackLocations()),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!strict && cachedLocations) {
      setData(cachedLocations);
      return;
    }

    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const request =
          !strict && inFlightLocations
            ? inFlightLocations
            : fetch(`/api/locations${strict ? "?strict=true" : ""}`).then(
                async (res) => {
                  if (!res.ok) throw new Error("Failed to load locations");
                  const payload = (await res.json()) as { data?: Locations };
                  if (!payload.data) throw new Error("No locations");
                  if (!strict) cachedLocations = payload.data;
                  return payload.data;
                },
              );
        if (!strict) inFlightLocations = request;
        const payload = { data: await request };
        if (!mounted) return;
        if (payload.data) {
          setData(payload.data);
        } else {
          throw new Error("No locations");
        }
      } catch {
        if (strict) {
          setData({});
          setError("Locations unavailable");
          return;
        }
        setData(fallbackLocations());
      } finally {
        if (!strict) inFlightLocations = null;
        if (mounted) setLoading(false);
      }
    };
    const cancelScheduledLoad = scheduleLoad(load, defer);
    return () => {
      mounted = false;
      cancelScheduledLoad();
    };
  }, [defer, strict]);

  const regions = useMemo(() => Object.keys(data).sort(), [data]);
  const cities = useMemo(() => {
    const out: { region: string; city: string }[] = [];
    regions.forEach((r) => {
      (data[r] ?? []).forEach((c) => out.push({ region: r, city: c }));
    });
    return out;
  }, [data, regions]);

  return { regions, data, citiesByRegion: data, loading, error, all: cities };
}
