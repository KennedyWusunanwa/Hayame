// Reads the maintenance row for the proxy and pages. Uses plain fetch against
// Supabase REST with the service role (the table has no public policy) and a
// short in-memory cache so the proxy adds at most one lookup per few seconds.
import {
  DEFAULT_MAINTENANCE,
  rowToSettings,
  type MaintenanceSettings,
} from "@/lib/maintenance-core";

const CACHE_TTL_MS = 5_000;
let cache: { at: number; value: MaintenanceSettings | null } | null = null;

export function invalidateMaintenanceCache() {
  cache = null;
}

/** Returns null (fail open) when storage isn't configured or can't be reached. */
export async function getMaintenanceSettings(): Promise<MaintenanceSettings | null> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.value;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  try {
    const res = await fetch(`${url}/rest/v1/site_maintenance?id=eq.1&select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(2_000),
    });
    if (!res.ok) throw new Error(`site_maintenance ${res.status}`);
    const rows = (await res.json()) as unknown[];
    const value = rows.length
      ? rowToSettings(rows[0] as Parameters<typeof rowToSettings>[0])
      : { ...DEFAULT_MAINTENANCE };
    cache = { at: now, value };
    return value;
  } catch {
    // Table missing or Supabase slow: keep the last known state, else stay open.
    if (cache) {
      cache = { at: now, value: cache.value };
      return cache.value;
    }
    return null;
  }
}
