import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { failJson } from "@/lib/api-errors";
import {
  BOOKING_CHECKOUT_SELECT,
  CHECKOUT_ABANDONED_REASON,
  computeCheckoutPricing,
  isFinalizedBooking,
  loadCheckoutCar,
  loadPlatformFeePercent,
  reconcilePendingPayment,
} from "@/lib/bookings/checkout-resume";

export const dynamic = "force-dynamic";

type Body = { bookingId?: string };

// Drop an unfinished checkout for good: release the hold so the car's
// calendar frees up and mark the row so it is never offered for resume again.
// If the renter had in fact paid, the booking is confirmed instead.

export async function POST(req: Request) {
  try {
    const body = ((await req.json().catch(() => ({}))) ?? {}) as Body;
    const bookingId = String(body.bookingId ?? "").trim();
    if (!bookingId) {
      return NextResponse.json(
        { message: "bookingId is required" },
        { status: 400 },
      );
    }

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

    const { data: booking } = await db
      .from("bookings")
      .select(BOOKING_CHECKOUT_SELECT)
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking) {
      // Already gone: nothing to abandon, and nothing to show.
      return NextResponse.json({ data: { outcome: "abandoned", bookingId } });
    }
    if (booking.renter_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (isFinalizedBooking(booking)) {
      return NextResponse.json(
        {
          message: "This booking is already confirmed and can't be abandoned.",
          data: { outcome: "completed", bookingId: booking.id },
        },
        { status: 409 },
      );
    }

    if (String(booking.payment_reference ?? "").trim()) {
      const car = await loadCheckoutCar(db, booking.car_id);
      const platformFeePercent = await loadPlatformFeePercent(db);
      const pricing = computeCheckoutPricing({
        car: car ?? {},
        booking,
        platformFeePercent,
      });
      const reconciled = await reconcilePendingPayment(
        req,
        booking,
        pricing.amountMinor,
      );
      if (reconciled.outcome === "completed") {
        return NextResponse.json({
          data: {
            outcome: "completed",
            bookingId: reconciled.booking.id,
            conversationId: reconciled.conversationId,
          },
        });
      }
    }

    if (admin) {
      await admin
        .from("bookings")
        .update({
          status: "cancelled",
          payment_status: "failed",
          hold_expires_at: null,
          rejection_reason: CHECKOUT_ABANDONED_REASON,
        })
        .eq("id", booking.id)
        .neq("payment_status", "paid")
        .in("status", ["pending", "cancelled"]);
    } else {
      await db
        .from("bookings")
        .update({ rejection_reason: CHECKOUT_ABANDONED_REASON })
        .eq("id", booking.id);
    }

    return NextResponse.json({
      data: { outcome: "abandoned", bookingId: booking.id },
    });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/mobile/bookings/checkout/abandon",
      status: 400,
      userMessage: "We couldn't clear that booking. Please try again.",
    });
  }
}
