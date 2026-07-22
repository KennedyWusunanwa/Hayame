import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Rate limiting for auth endpoints.
 *
 * Two jobs:
 *   1. Stop login-error probing. We tell users whether the email or the
 *      password was wrong, which is much friendlier but also lets someone
 *      script the endpoint to discover which addresses have Hayame accounts.
 *      A per-IP cap makes harvesting impractical.
 *   2. Stop us hammering the mail provider. Supabase's own limiter used to
 *      reject bursts with `over_email_send_rate_limit`, which surfaced as a
 *      raw error report. We now throttle before sending and return a calm,
 *      countdown-style message instead.
 *
 * Storage is the `auth_rate_limits` table so the window is shared across
 * serverless instances. If that table hasn't been migrated yet we fall back to
 * a per-instance in-memory window rather than failing the request — a partially
 * effective limiter is strictly better than a broken login page.
 */

const memoryHits = new Map<string, number[]>();
let tableMissing = false;

function pruneMemory(key: string, windowStartMs: number) {
  const hits = (memoryHits.get(key) ?? []).filter((ts) => ts >= windowStartMs);
  if (hits.length) memoryHits.set(key, hits);
  else memoryHits.delete(key);
  return hits;
}

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the caller may retry. 0 when allowed. */
  retryAfterSeconds: number;
};

export type RateLimitOptions = {
  /** Stable bucket name, e.g. "login" or "verify-email". */
  scope: string;
  /** What we're limiting: an IP, a lowercased email, or `${scope}:${ip}`. */
  identifier: string;
  /** Attempts permitted inside the window. */
  limit: number;
  windowSeconds: number;
};

function memoryLimit(opts: RateLimitOptions, nowMs: number): RateLimitResult {
  const key = `${opts.scope}:${opts.identifier}`;
  const windowStartMs = nowMs - opts.windowSeconds * 1000;
  const hits = pruneMemory(key, windowStartMs);

  if (hits.length >= opts.limit) {
    const oldest = hits[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + opts.windowSeconds * 1000 - nowMs) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }

  hits.push(nowMs);
  memoryHits.set(key, hits);
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Records an attempt and reports whether it is permitted. Always call this
 * BEFORE doing the expensive/sensitive work, and honour `allowed`.
 */
export async function checkRateLimit(
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const nowMs = Date.now();

  if (tableMissing) return memoryLimit(opts, nowMs);

  try {
    // `auth_rate_limits` isn't in the generated Database types (it arrives via
    // db/auth-rate-limits.sql), so the typed client can't see it.
    const admin = createSupabaseAdminClient() as any;
    const windowStart = new Date(
      nowMs - opts.windowSeconds * 1000,
    ).toISOString();

    const { data, error } = await admin
      .from("auth_rate_limits")
      .select("created_at")
      .eq("scope", opts.scope)
      .eq("identifier", opts.identifier)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: true });

    if (error) {
      // PGRST205 is PostgREST's "table not in the schema cache"; 42P01 is
      // Postgres's undefined_table. Latch it so we stop paying for a failed
      // round trip on every single auth request before the migration runs.
      if (error.code === "PGRST205" || error.code === "42P01") {
        tableMissing = true;
        console.warn(
          "[rate-limit] auth_rate_limits table missing — using per-instance " +
            "in-memory limiting. Run db/auth-rate-limits.sql to enable shared limits.",
        );
        return memoryLimit(opts, nowMs);
      }
      throw error;
    }

    const hits = data ?? [];
    if (hits.length >= opts.limit) {
      const oldest = new Date(hits[0].created_at as string).getTime();
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldest + opts.windowSeconds * 1000 - nowMs) / 1000),
      );
      return { allowed: false, retryAfterSeconds };
    }

    await admin
      .from("auth_rate_limits")
      .insert({ scope: opts.scope, identifier: opts.identifier });

    return { allowed: true, retryAfterSeconds: 0 };
  } catch (error) {
    // Never let the limiter itself take down auth. Degrade to in-memory.
    console.warn("[rate-limit] falling back to in-memory window", error);
    return memoryLimit(opts, nowMs);
  }
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** "in 45 seconds" / "in 2 minutes" — for user-facing throttle messages. */
export function humanRetryAfter(seconds: number) {
  if (seconds <= 90) return `in ${Math.max(1, seconds)} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
}
