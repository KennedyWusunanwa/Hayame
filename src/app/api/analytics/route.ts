import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { logServerError } from "@/lib/api-errors";
import {
  isAnalyticsEvent,
  sanitizeProps,
  type AnalyticsProps,
} from "@/lib/analytics/events";

/**
 * First-party analytics ingest.
 *
 * This endpoint is intentionally public (anonymous browsing is most of the
 * funnel), which means it is also the easiest endpoint in the app to abuse.
 * Three defences:
 *   1. An allowlist of event names and prop keys (see lib/analytics/events).
 *   2. A batch cap and a per-IP rate limit.
 *   3. Writes go through the service role here — the browser never touches the
 *      table directly, so RLS stays fully closed.
 *
 * It always returns 204, even on bad input. Analytics must never surface an
 * error to a user or block a page — a dropped event is always preferable to a
 * broken booking flow.
 */

const MAX_BATCH = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_EVENTS = 120;

/**
 * In-memory limiter. On serverless this is per-instance rather than global, so
 * it is a speed bump against casual flooding, not a hard guarantee. It is worth
 * having anyway: it costs nothing and stops the common case. If abuse becomes
 * real, move this to Postgres or Upstash.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string, cost: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: cost, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += cost;
  return entry.count > RATE_LIMIT_MAX_EVENTS;
}

// Keep the map from growing without bound across a long-lived instance.
function sweep() {
  const now = Date.now();
  if (hits.size < 5000) return;
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key);
  }
}

function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  return ip || req.headers.get("x-real-ip") || "unknown";
}

/** Query strings can carry search text and ids; keep the path only. */
function safePath(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const withoutQuery = value.split("?")[0].split("#")[0];
  return withoutQuery.slice(0, 200) || null;
}

/** Referrers can contain full URLs with query params. Keep the hostname only. */
function safeReferrerHost(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  try {
    return new URL(value).hostname.slice(0, 120) || null;
  } catch {
    return null;
  }
}

function safeSessionKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  // Our own generated format only; reject anything else so this field cannot be
  // used to smuggle arbitrary text into the table.
  if (!/^sess_[a-z0-9]+_\d+$/i.test(value)) return null;
  return value.slice(0, 80);
}

function safePlatform(value: unknown): string {
  return value === "ios" || value === "android" ? value : "web";
}

type IncomingEvent = {
  name?: unknown;
  props?: unknown;
  path?: unknown;
  referrer?: unknown;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      events?: IncomingEvent[];
      sessionKey?: unknown;
      platform?: unknown;
      appVersion?: unknown;
    };

    const incoming = Array.isArray(body.events)
      ? body.events.slice(0, MAX_BATCH)
      : [];
    if (incoming.length === 0) return new NextResponse(null, { status: 204 });

    sweep();
    if (rateLimited(clientKey(req), incoming.length)) {
      return new NextResponse(null, { status: 204 });
    }

    const valid = incoming.filter(
      (event) => typeof event?.name === "string" && isAnalyticsEvent(event.name),
    );
    if (valid.length === 0) return new NextResponse(null, { status: 204 });

    // Resolve the signed-in user if there is one. Anonymous events are expected
    // and fine — most of the discovery funnel happens before signup.
    let userId: string | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const user = await getRequestUser(supabase as never, req);
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }

    const sessionKey = safeSessionKey(body.sessionKey);
    const platform = safePlatform(body.platform);
    const appVersion =
      typeof body.appVersion === "string" ? body.appVersion.slice(0, 40) : null;

    const rows = valid.map((event) => ({
      name: event.name as string,
      props: sanitizeProps(event.props) as AnalyticsProps,
      user_id: userId,
      session_key: sessionKey,
      platform,
      app_version: appVersion,
      path: safePath(event.path),
      referrer_host: safeReferrerHost(event.referrer),
    }));

    const admin = createSupabaseAdminClient() as unknown as {
      from: (table: string) => {
        insert: (rows: unknown[]) => Promise<{ error: unknown }>;
      };
    };
    const { error } = await admin.from("analytics_events").insert(rows);
    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Log for admins, but never tell the client. Analytics failures are ours.
    await logServerError({
      error,
      req,
      route: "/api/analytics",
      status: 204,
      context: { note: "analytics ingest failed; event dropped" },
    });
    return new NextResponse(null, { status: 204 });
  }
}
