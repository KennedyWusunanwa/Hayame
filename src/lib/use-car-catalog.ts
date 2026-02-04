"use client";

import { useEffect, useMemo, useState } from "react";

type CarModel = {
  id: string;
  name: string;
};

type CarMake = {
  id: string;
  name: string;
  models: CarModel[];
};

export function useCarCatalog() {
  const [makes, setMakes] = useState<CarMake[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/car-catalog", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load catalog");
        const payload = (await res.json()) as { makes?: CarMake[] };
        if (mounted) setMakes(payload.makes ?? []);
      } catch (err: any) {
        if (mounted) setError(err.message ?? "Catalog unavailable");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const makesById = useMemo(() => {
    const map = new Map<string, CarMake>();
    makes.forEach((make) => map.set(make.id, make));
    return map;
  }, [makes]);

  return { makes, makesById, loading, error };
}
