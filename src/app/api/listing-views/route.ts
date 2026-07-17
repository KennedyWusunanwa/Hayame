import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { failJson } from "@/lib/api-errors";

/**
 * Records a listing view for the host's daily view count.
 *
 * This endpoint is public (anonymous browsing is most of the funnel), so
 * anything on the internet can post to it. Input is therefore validated here
 * rather than left to Postgres: an unparseable car id used to reach the insert
 * and come back as 22P02 ("invalid input syntax for type uuid"), which then
 * filed an error report. A bot posting junk should not be able to write to the
 * admin diagnostics dashboard.
 *
 * Bad input is a client mistake, not a server fault: reject it quietly with a
 * 400 and no error report. Genuine faults still log via failJson below.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Our own generated format only — matches the analytics ingest route. */
const SESSION_KEY_RE = /^sess_[a-z0-9]+_\d+$/i;

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      carId?: unknown;
      sessionKey?: unknown;
    };

    const carId = typeof body.carId === "string" ? body.carId : "";
    if (!UUID_RE.test(carId)) {
      // Covers missing, malformed, and legacy non-UUID ids alike.
      return NextResponse.json({ message: "Invalid carId" }, { status: 400 });
    }

    const sessionKey =
      typeof body.sessionKey === "string" && SESSION_KEY_RE.test(body.sessionKey)
        ? body.sessionKey
        : null;

    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const user = await getRequestUser(supabase as any, req);

    const payload = {
      car_id: carId,
      viewer_id: user?.id ?? null,
      session_key: sessionKey,
    };

    const { error } = await supa.from("listing_views").insert(payload);
    if (error) {
      const text = String(error.message ?? "").toLowerCase();
      if (text.includes("duplicate key")) {
        // Expected: the unique daily index doing its job on a refresh.
        return NextResponse.json({ ok: true, duplicate: true });
      }
      // A view for a car that no longer exists is routine after a delisting,
      // not a bug worth reporting.
      if (text.includes("foreign key") || text.includes("violates")) {
        return NextResponse.json({ ok: true, ignored: true });
      }
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/listing-views",
      status: 400,
      userMessage: "Couldn't save the listing view. Please try again.",
    });
  }
}
