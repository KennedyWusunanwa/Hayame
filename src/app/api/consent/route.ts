import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { logServerError } from "@/lib/api-errors";
import { CONSENT_POLICY_VERSION } from "@/lib/analytics/consent";

/**
 * Records proof that a consent choice was made.
 *
 * This exists because GDPR Art. 7(1) puts the burden of proof on us: if
 * challenged, we must be able to demonstrate that consent was given, not merely
 * assert it. A localStorage flag on the visitor's own device proves nothing.
 *
 * We deliberately do NOT store an IP address here. Some vendors do, arguing it
 * strengthens the record — but an IP is itself personal data, and collecting
 * more personal data to prove you respect personal data is a bad trade. The
 * pseudonymous session key plus a timestamp is enough to make the record useful.
 *
 * Note that we record BOTH grants and denials. A denial record is what lets us
 * show that a user was asked and said no.
 */

/** Coarse UA family, not the full string — a full UA is a fingerprinting vector. */
function userAgentFamily(req: Request): string | null {
  const ua = (req.headers.get("user-agent") ?? "").toLowerCase();
  if (!ua) return null;
  if (ua.includes("edg/")) return "edge";
  if (ua.includes("chrome/") && !ua.includes("chromium")) return "chrome";
  if (ua.includes("firefox/")) return "firefox";
  if (ua.includes("safari/")) return "safari";
  return "other";
}

function safeSessionKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!/^sess_[a-z0-9]+_\d+$/i.test(value)) return null;
  return value.slice(0, 80);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      analytics?: unknown;
      sessionKey?: unknown;
      platform?: unknown;
    };

    if (typeof body.analytics !== "boolean") {
      return new NextResponse(null, { status: 204 });
    }

    let userId: string | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const user = await getRequestUser(supabase as never, req);
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }

    const admin = createSupabaseAdminClient() as unknown as {
      from: (table: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
      };
    };

    const { error } = await admin.from("consent_records").insert({
      session_key: safeSessionKey(body.sessionKey),
      user_id: userId,
      analytics: body.analytics,
      policy_version: CONSENT_POLICY_VERSION,
      platform: body.platform === "ios" ? "ios" : "web",
      user_agent_family: userAgentFamily(req),
    });
    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    await logServerError({
      error,
      req,
      route: "/api/consent",
      status: 204,
      // The banner is live before db/analytics.sql is run, so without this every
      // Accept/Decline from every visitor files a report.
      skipIfTableMissing: true,
      context: { note: "consent record insert failed" },
    });
    // The visitor's choice is already applied client-side; never surface this.
    return new NextResponse(null, { status: 204 });
  }
}
