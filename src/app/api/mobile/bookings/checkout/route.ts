import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { failJson } from "@/lib/api-errors";
import {
  buildPendingCheckout,
  expireRenterHolds,
  findResumableCheckout,
  reconcilePendingPayment,
} from "@/lib/bookings/checkout-resume";

export const dynamic = "force-dynamic";

// The renter's unfinished checkout, if any. Returned with the car, the saved
// options, the authoritative price and every condition that would block it,
// so the app can show a "Finish your booking" card and know whether to offer
// Resume or only Change dates / Abandon.

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();
    const db = admin ?? (supabase as any);
    const user = await getRequestUser(supabase as any, req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await expireRenterHolds(admin, user.id);

    const booking = await findResumableCheckout(db, user.id);
    if (!booking) {
      return NextResponse.json({ data: null });
    }

    const { pricing, dto } = await buildPendingCheckout({
      db,
      userId: user.id,
      booking,
    });

    // A payment that went through at Paystack but never reached the app is
    // confirmed here, so the renter is told it's done instead of asked to pay
    // again.
    const reconciled = await reconcilePendingPayment(
      req,
      booking,
      pricing.amountMinor,
    );
    if (reconciled.outcome === "completed") {
      return NextResponse.json({
        data: null,
        completed: {
          bookingId: reconciled.booking.id,
          status: reconciled.booking.status ?? null,
          conversationId: reconciled.conversationId,
        },
      });
    }

    return NextResponse.json({ data: dto });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/mobile/bookings/checkout",
      status: 400,
      userMessage: "Couldn't check for an unfinished booking. Please try again.",
    });
  }
}
