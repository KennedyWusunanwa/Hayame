import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { failJson } from "@/lib/api-errors";
import { POST as createBookingHold } from "@/app/api/bookings/hold/route";
import {
  BOOKING_CHECKOUT_SELECT,
  CHECKOUT_SUPERSEDED_REASON,
  buildPendingCheckout,
  freshHoldExpiry,
  isAbandonedCheckout,
  isFinalizedBooking,
  isHoldActive,
  reconcilePendingPayment,
} from "@/lib/bookings/checkout-resume";

export const dynamic = "force-dynamic";

type Body = { bookingId?: string };

// Resume an unfinished checkout. In order:
//   1. If the held reference was actually paid at Paystack, finalize it and
//      report the booking as completed (no second charge).
//   2. Re-check every condition: car still bookable, not the renter's own,
//      dates still in the future and still free, delivery still offered.
//   3. Refresh the 15-minute hold, or create a fresh one through the normal
//      hold path when the old one died, so Paystack can be opened right away.
// The response always carries the full checkout so the app can render it.

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
      return NextResponse.json(
        { message: "This checkout is no longer available.", code: "checkout_gone" },
        { status: 404 },
      );
    }
    if (booking.renter_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    if (isFinalizedBooking(booking)) {
      return NextResponse.json({
        data: { outcome: "completed", bookingId: booking.id, booking },
      });
    }
    if (isAbandonedCheckout(booking)) {
      return NextResponse.json(
        {
          message: "This checkout was abandoned. Start a new booking from the listing.",
          code: "checkout_abandoned",
        },
        { status: 404 },
      );
    }

    const first = await buildPendingCheckout({ db, userId: user.id, booking });

    const reconciled = await reconcilePendingPayment(
      req,
      booking,
      first.pricing.amountMinor,
    );
    if (reconciled.outcome === "completed") {
      return NextResponse.json({
        data: {
          outcome: "completed",
          bookingId: reconciled.booking.id,
          booking: reconciled.booking,
          conversationId: reconciled.conversationId,
        },
      });
    }

    if (first.dto.issues.length > 0) {
      return NextResponse.json({
        data: { outcome: "blocked", checkout: first.dto },
      });
    }

    let activeBooking: any = booking;

    if (isHoldActive(booking)) {
      if (admin) {
        const { data: extended } = await admin
          .from("bookings")
          .update({ hold_expires_at: freshHoldExpiry() })
          .eq("id", booking.id)
          .eq("status", "pending")
          .select(BOOKING_CHECKOUT_SELECT)
          .maybeSingle();
        if (extended) activeBooking = extended;
      }
    } else {
      // The old hold is dead (timed out or cancelled). Take a fresh one through
      // the regular hold route so it gets the same validation and overlap
      // protection as a first-time booking, then retire the old row.
      const deliveryAddress = String(booking.delivery_address ?? "").trim();
      const headers = new Headers({ "content-type": "application/json" });
      const authorization = req.headers.get("authorization");
      if (authorization) headers.set("authorization", authorization);
      const cookie = req.headers.get("cookie");
      if (cookie) headers.set("cookie", cookie);
      const holdResponse = await createBookingHold(
        new Request(new URL("/api/bookings/hold", req.url), {
          method: "POST",
          headers,
          body: JSON.stringify({
            carId: booking.car_id,
            startDate: booking.start_date,
            endDate: booking.end_date,
            tripMode: deliveryAddress ? "delivery" : "pickup",
            tripUseRegion: booking.trip_use_region,
            tripUseCity: booking.trip_use_city,
            tripUseAddress: booking.trip_use_address,
            deliveryAddress: deliveryAddress || undefined,
            deliveryTime: deliveryAddress
              ? String(booking.delivery_time ?? "").trim() || undefined
              : undefined,
            contactPhone: deliveryAddress
              ? String(booking.contact_phone ?? "").trim() || undefined
              : undefined,
            deliveryNotes: deliveryAddress
              ? String(booking.delivery_notes ?? "").trim() || undefined
              : undefined,
          }),
        }),
      );
      const holdPayload = (await holdResponse.json().catch(() => null)) as any;
      const newBookingId = String(holdPayload?.bookingId ?? "").trim();
      if (!holdResponse.ok || !newBookingId) {
        const message =
          String(holdPayload?.message ?? "").trim() ||
          "We couldn't hold this car again. Please pick new dates.";
        return NextResponse.json({
          data: {
            outcome: "blocked",
            checkout: {
              ...first.dto,
              canResume: false,
              issues: [
                {
                  code:
                    holdResponse.status === 409 ? "dates_taken" : "hold_failed",
                  message,
                },
              ],
            },
          },
        });
      }

      if (newBookingId !== booking.id) {
        if (admin) {
          await admin
            .from("bookings")
            .update({
              status: "cancelled",
              payment_status: "failed",
              hold_expires_at: null,
              rejection_reason: CHECKOUT_SUPERSEDED_REASON,
            })
            .eq("id", booking.id)
            .in("status", ["pending", "cancelled"])
            .neq("payment_status", "paid");
        } else {
          await db
            .from("bookings")
            .update({ rejection_reason: CHECKOUT_SUPERSEDED_REASON })
            .eq("id", booking.id);
        }
      }

      const { data: fresh } = await db
        .from("bookings")
        .select(BOOKING_CHECKOUT_SELECT)
        .eq("id", newBookingId)
        .maybeSingle();
      if (fresh) activeBooking = fresh;
    }

    const rebuilt = await buildPendingCheckout({
      db,
      userId: user.id,
      booking: activeBooking,
      car: first.car,
    });
    return NextResponse.json({
      data: {
        outcome: rebuilt.dto.issues.length > 0 ? "blocked" : "ready",
        checkout: rebuilt.dto,
      },
    });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/mobile/bookings/checkout/resume",
      status: 400,
      userMessage: "We couldn't resume your booking. Please try again.",
    });
  }
}
