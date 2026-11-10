import { NextResponse } from "next/server";
import { failJson } from "@/lib/api-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import {
  buildAccountDeletionRequestedEmail,
  buildAdminAccountDeletionEmail,
  sendAdminNotificationSafe,
  sendEmailSafe,
} from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * A signed-in user asks for their account to be deleted. Nothing is removed
 * here: the office is told, the user gets a confirmation, and a person deletes
 * the account within 30 days once open trips and money are settled.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as {
      platform?: unknown;
    } | null;
    const platform =
      typeof body?.platform === "string" &&
      ["ios", "android", "web"].includes(body.platform.trim().toLowerCase())
        ? body.platform.trim().toLowerCase()
        : "unknown";

    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();
    const db = admin ?? (supabase as any);

    const [{ data: profile }, renterTrips, hostCars] = await Promise.all([
      db.from("profiles").select("full_name,is_host").eq("id", user.id).maybeSingle(),
      db
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("renter_id", user.id)
        .in("status", ["awaiting_host", "confirmed"]),
      db.from("cars").select("id").eq("owner_id", user.id).limit(200),
    ]);
    const carIds = ((hostCars?.data ?? []) as any[]).map((car) => car.id);
    const hostTrips =
      carIds.length > 0
        ? await db
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .in("car_id", carIds)
            .in("status", ["awaiting_host", "confirmed"])
        : { count: 0 };
    const openTrips = (renterTrips?.count ?? 0) + (hostTrips?.count ?? 0);

    const requestedAt = new Date().toISOString();
    const day = requestedAt.slice(0, 10);
    const userName =
      (profile as any)?.full_name ??
      (user.user_metadata as any)?.full_name ??
      user.email ??
      "A user";

    const results = await Promise.allSettled([
      sendAdminNotificationSafe({
        template: buildAdminAccountDeletionEmail({
          userId: user.id,
          userName,
          userEmail: user.email ?? null,
          platform,
          openTrips,
          isHost: Boolean((profile as any)?.is_host),
          requestedAt,
        }),
        // One notice per person per day, however many times the button is tapped.
        idempotencyKey: `account-deletion:${user.id}:${day}:admin`,
        replyTo: user.email ?? undefined,
      }),
      user.email
        ? sendEmailSafe({
            to: user.email,
            ...buildAccountDeletionRequestedEmail({
              userName,
              hasOpenTrips: openTrips > 0,
            }),
            idempotencyKey: `account-deletion:${user.id}:${day}:user`,
          })
        : Promise.resolve(null),
    ]);
    // The request only exists as the notice to the office, so if that failed
    // the user must be told to try again rather than believe it was received.
    const officeNotice: any =
      results[0].status === "fulfilled" ? results[0].value : { error: true };
    if (!officeNotice || officeNotice.skipped || officeNotice.error) {
      return NextResponse.json(
        {
          message:
            "We couldn't send your request. Please try again or email support.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      data: {
        requested: true,
        openTrips,
        message:
          openTrips > 0
            ? "We have your request. Your account will be deleted once your current trips are finished and settled."
            : "We have your request. Your account will be deleted within 30 days. Check your email for confirmation.",
      },
    });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/account/deletion-request",
      status: 400,
      userMessage:
        "We couldn't send your request. Please try again or email support.",
    });
  }
}
