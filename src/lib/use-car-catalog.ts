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

type UseCarCatalogOptions = {
  defer?: boolean;
};

let cachedMakes: CarMake[] | null = null;
let inFlightCatalog: Promise<CarMake[]> | null = null;

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
    const id = idleWindow.requestIdleCallback(callback, { timeout: 1400 });
    return () => idleWindow.cancelIdleCallback?.(id);
  }

  const timeout = window.setTimeout(callback, 450);
  return () => window.clearTimeout(timeout);
}

export function useCarCatalog(options: UseCarCatalogOptions = {}) {
  const { defer = false } = options;
  const [makes, setMakes] = useState<CarMake[]>(() => cachedMakes ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedMakes) {
      setMakes(cachedMakes);
      return;
    }

    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const request =
          inFlightCatalog ??
          fetch("/api/car-catalog").then(async (res) => {
            if (!res.ok) throw new Error("Failed to load catalog");
            const payload = (await res.json()) as { makes?: CarMake[] };
            cachedMakes = payload.makes ?? [];
            return cachedMakes;
          });
        inFlightCatalog = request;
        const nextMakes = await request;
        if (mounted) setMakes(nextMakes);
      } catch (err: any) {
        if (mounted) setError(err.message ?? "Catalog unavailable");
      } finally {
        inFlightCatalog = null;
        if (mounted) setLoading(false);
      }
    };
    const cancelScheduledLoad = scheduleLoad(load, defer);
    return () => {
      mounted = false;
      cancelScheduledLoad();
    };
  }, [defer]);

  const makesById = useMemo(() => {
    const map = new Map<string, CarMake>();
    makes.forEach((make) => map.set(make.id, make));
    return map;
  }, [makes]);

  return { makes, makesById, loading, error };
}
