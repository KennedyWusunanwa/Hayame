"use client";

import { useEffect, useMemo, useState } from "react";
import { fallbackCities } from "./utils";

type Locations = Record<string, string[]>;

type UseLocationsOptions = {
  strict?: boolean;
};

export function useLocations(options: UseLocationsOptions = {}) {
  const { strict = false } = options;
  const [data, setData] = useState<Locations>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/locations${strict ? "?strict=true" : ""}`,
        );
        if (!res.ok) throw new Error("Failed to load locations");
        const payload = (await res.json()) as { data?: Locations };
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
        const grouped: Locations = {};
        fallbackCities.forEach((c) => {
          if (!grouped[c.region]) grouped[c.region] = [];
          grouped[c.region].push(c.city);
        });
        setData(grouped);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [strict]);

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
