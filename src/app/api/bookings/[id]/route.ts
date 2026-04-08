import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { refundPaystack } from "@/lib/paystack";
import { buildHostDecisionEmail, sendEmailSafe } from "@/lib/email";
import { sendPushNotificationsToUsers } from "@/lib/push";

function extractAuthEmail(result: any): string | null {
  return (
    result?.data?.user?.email ?? result?.user?.email ?? result?.email ?? null
  );
}

function extractRefundReference(payload: any): string | null {
  const candidates = [
    payload?.reference,
    payload?.refund_reference,
    payload?.transaction_reference,
    payload?.id,
  ];
  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (value) return value;
  }
  return null;
}

type Params = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const resolvedParams = await params;
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

    const { id } = resolvedParams;
    const payload = (await req.json().catch(() => ({}))) as {
      action?: string;
      reason?: string;
    };
    const action = payload?.action;
    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await db
      .from("bookings")
      .select("*, cars:cars!inner(owner_id,title)")
      .eq("id", id)
      .single();
    if (bookingError || !booking)
      throw bookingError ?? new Error("Booking not found");

    const ownerId = (booking as any)?.cars?.owner_id;
    if (ownerId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "awaiting_host") {
      return NextResponse.json(
        { message: "Only pending approvals can be modified" },
        { status: 400 },
      );
    }

    if (action === "approve") {
      const { data, error } = await db
        .from("bookings")
        .update({ status: "confirmed", approved_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      if (admin) {
        const renterId = booking.renter_id;
        const [renterAuthResult, hostProfileResult] = await Promise.all([
          admin.auth.admin.getUserById(renterId).catch(() => null),
          admin
            .from("profiles")
            .select("full_name")
            .eq("id", ownerId)
            .maybeSingle(),
        ]);
        const renterEmail = extractAuthEmail(renterAuthResult);
        if (renterEmail) {
          const email = buildHostDecisionEmail({
            approved: true,
            hostName:
              (
                (hostProfileResult as any)?.data as {
                  full_name?: string | null;
                } | null
              )?.full_name ?? null,
            carTitle: booking?.car_id ? (booking?.cars?.title ?? null) : null,
            startDate: booking.start_date,
            endDate: booking.end_date,
          });
          await sendEmailSafe({
            to: renterEmail,
            ...email,
            idempotencyKey: `booking:${booking.id}:approved`,
          });
        }
      }

      try {
        const pushResult = await sendPushNotificationsToUsers({
          adminClient: admin,
          userIds: [String(booking.renter_id ?? "")],
          title: "Booking confirmed",
          body: `Your trip for ${booking?.cars?.title ?? "your booking"} is confirmed.`,
          collapseId: `booking:${booking.id}:status`,
          preferenceKey: "booking_updates",
          notificationCategory: "booking_updates",
          data: {
            type: "booking_status",
            bookingId: String(booking.id ?? ""),
            carId: String(booking.car_id ?? ""),
            status: "confirmed",
          },
        });
        if (pushResult.skipped || pushResult.delivered === 0) {
          console.warn(
            "[bookings/:id] approval push skipped or undelivered",
            pushResult,
          );
        }
      } catch (pushError) {
        console.error("[bookings/:id] approval push failed", pushError);
      }

      return NextResponse.json({ data });
    }

    // reject path
    let refundReference: string | null = null;
    if (booking.payment_provider === "paystack" && booking.payment_reference) {
      const refundData = await refundPaystack(booking.payment_reference);
      refundReference =
        extractRefundReference(refundData) ?? booking.payment_reference;
    }

    const { data, error } = await db
      .from("bookings")
      .update({
        status: "rejected",
        payment_status: "refunded",
        refund_reference: refundReference,
        rejected_at: new Date().toISOString(),
        rejection_reason: payload?.reason ?? "Rejected by host",
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    if (admin) {
      const renterId = booking.renter_id;
      const [renterAuthResult, hostProfileResult] = await Promise.all([
        admin.auth.admin.getUserById(renterId).catch(() => null),
        admin
          .from("profiles")
          .select("full_name")
          .eq("id", ownerId)
          .maybeSingle(),
      ]);
      const renterEmail = extractAuthEmail(renterAuthResult);
      if (renterEmail) {
        const email = buildHostDecisionEmail({
          approved: false,
          hostName:
            (
              (hostProfileResult as any)?.data as {
                full_name?: string | null;
              } | null
            )?.full_name ?? null,
          carTitle: booking?.car_id ? (booking?.cars?.title ?? null) : null,
          startDate: booking.start_date,
          endDate: booking.end_date,
          reason: payload?.reason ?? booking?.rejection_reason ?? null,
        });
        await sendEmailSafe({
          to: renterEmail,
          ...email,
          idempotencyKey: `booking:${booking.id}:rejected`,
        });
      }
    }

    try {
      const reasonText = String(
        payload?.reason ?? booking?.rejection_reason ?? "Rejected by host",
      ).trim();
      const pushResult = await sendPushNotificationsToUsers({
        adminClient: admin,
        userIds: [String(booking.renter_id ?? "")],
        title: "Booking request declined",
        body: reasonText
          ? `${booking?.cars?.title ?? "Your booking"} was declined: ${reasonText}`
          : "Your booking was declined and refunded.",
        collapseId: `booking:${booking.id}:status`,
        preferenceKey: "booking_updates",
        notificationCategory: "booking_updates",
        data: {
          type: "booking_status",
          bookingId: String(booking.id ?? ""),
          carId: String(booking.car_id ?? ""),
          status: "rejected",
          refunded: true,
        },
      });
      if (pushResult.skipped || pushResult.delivered === 0) {
        console.warn(
          "[bookings/:id] rejection push skipped or undelivered",
          pushResult,
        );
      }
    } catch (pushError) {
      console.error("[bookings/:id] rejection push failed", pushError);
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Failed to update booking" },
      { status: 400 },
    );
  }
}
