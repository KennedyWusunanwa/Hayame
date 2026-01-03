"use client";

import { useEffect, useMemo, useState } from "react";
import { fallbackCities } from "./utils";

type Locations = Record<string, string[]>;

export function useLocations() {
  const [data, setData] = useState<Locations>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/locations");
        if (!res.ok) throw new Error("Failed to load locations");
        const payload = (await res.json()) as { data?: Locations };
        if (payload.data) {
          setData(payload.data);
        } else {
          throw new Error("No locations");
        }
      } catch {
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
  }, []);

  const regions = useMemo(() => Object.keys(data).sort(), [data]);
  const cities = useMemo(() => {
    const out: { region: string; city: string }[] = [];
    regions.forEach((r) => {
      (data[r] ?? []).forEach((c) => out.push({ region: r, city: c }));
    });
    return out;
  }, [data, regions]);

  return { regions, data, citiesByRegion: data, loading, all: cities };
}
