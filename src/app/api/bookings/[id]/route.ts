import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { refundPaystack } from "@/lib/paystack";
import { failJson } from "@/lib/api-errors";
import {
  buildBookingCancelledEmail,
  buildHostDecisionEmail,
  sendEmailSafe,
} from "@/lib/email";
import { sendPushNotificationsToUsers } from "@/lib/push";

type CancellationOutcome = {
  amount: number;
  label: string;
};

// Server-enforced cancellation policy. `cancellation_policy` lives on the car
// (Flexible / Moderate / Strict, default Moderate). The security deposit is
// always returned in full; the rental portion is refunded by policy + notice.
function computeCancellationRefund(opts: {
  policy: string | null | undefined;
  status: string;
  total: number;
  deposit: number;
  start: Date;
}): CancellationOutcome {
  const { policy, status, total, deposit, start } = opts;
  // Not yet accepted by the host -> always a full refund.
  if (status === "awaiting_host") {
    return { amount: total, label: "host-approval-pending" };
  }
  const hoursUntilStart = (start.getTime() - Date.now()) / 3_600_000;
  const nonDeposit = Math.max(total - deposit, 0);
  let fraction: number;
  let label: string;
  switch (String(policy ?? "moderate").toLowerCase()) {
    case "flexible":
      fraction = hoursUntilStart >= 24 ? 1 : 0.5;
      label = "Flexible";
      break;
    case "strict":
      fraction = hoursUntilStart >= 168 ? 0.5 : 0;
      label = "Strict";
      break;
    case "moderate":
    default:
      fraction =
        hoursUntilStart >= 72 ? 1 : hoursUntilStart >= 24 ? 0.5 : 0;
      label = "Moderate";
      break;
  }
  const amount = deposit + nonDeposit * fraction;
  return { amount: Math.max(0, Math.min(amount, total)), label };
}

function extractAuthEmail(result: any): string | null {
  return (
    result?.data?.user?.email ?? result?.user?.email ?? result?.email ?? null
  );
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
    if (!action || !["approve", "reject", "cancel"].includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await db
      .from("bookings")
      .select("*, cars:cars!inner(owner_id,title,cancellation_policy)")
      .eq("id", id)
      .single();
    if (bookingError || !booking)
      throw bookingError ?? new Error("Booking not found");

    const ownerId = (booking as any)?.cars?.owner_id;
    const carTitle = (booking as any)?.cars?.title ?? null;

    // ---- Renter-initiated cancellation (with tiered refund) ----
    if (action === "cancel") {
      if (booking.renter_id !== user.id) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      if (!["awaiting_host", "confirmed"].includes(String(booking.status))) {
        return NextResponse.json(
          { message: "This booking can no longer be cancelled." },
          { status: 400 },
        );
      }
      // A confirmed trip that has already started can't be self-cancelled here
      // (it would otherwise refund days already consumed). Route to support.
      if (
        String(booking.status) === "confirmed" &&
        new Date(booking.start_date).getTime() <= Date.now()
      ) {
        return NextResponse.json(
          {
            message:
              "This trip has already started and can't be cancelled here. Please contact the host or support.",
          },
          { status: 400 },
        );
      }

      const total = Number(booking.total_price ?? 0);
      const deposit = Number(booking.deposit_amount ?? 0);
      const { amount: refundAmount, label: policyLabel } =
        computeCancellationRefund({
          policy: (booking as any)?.cars?.cancellation_policy,
          status: String(booking.status),
          total,
          deposit,
          start: new Date(booking.start_date),
        });
      const wasPaid =
        booking.payment_status === "paid" &&
        booking.payment_provider === "paystack" &&
        Boolean(booking.payment_reference);
      const willRefund = wasPaid && refundAmount > 0;

      // Atomic claim — a concurrent duplicate request updates 0 rows and so
      // never issues a second refund.
      const { data: cancelled, error: cancelError } = await db
        .from("bookings")
        .update({
          status: "cancelled",
          payment_status: willRefund ? "refunded" : booking.payment_status,
          refund_reference: willRefund ? booking.payment_reference : null,
          rejection_reason: payload?.reason ?? "Cancelled by guest",
        })
        .eq("id", id)
        .in("status", ["awaiting_host", "confirmed"])
        .select()
        .maybeSingle();
      if (cancelError) throw cancelError;
      if (!cancelled) {
        return NextResponse.json(
          { message: "Booking already processed." },
          { status: 409 },
        );
      }

      if (willRefund) {
        try {
          await refundPaystack(
            booking.payment_reference,
            refundAmount >= total ? undefined : Math.round(refundAmount * 100),
          );
        } catch (refundError) {
          console.error(
            "[bookings/:id] CRITICAL: refund failed after cancel — manual refund required",
            { reference: booking.payment_reference, refundError },
          );
          try {
            await db
              .from("bookings")
              .update({ payment_status: "refund_failed" })
              .eq("id", id);
          } catch {
            /* best effort */
          }
        }
      }

      // Notify host + renter (best effort).
      if (admin) {
        try {
          const [renterAuth, hostAuth] = await Promise.all([
            admin.auth.admin.getUserById(booking.renter_id).catch(() => null),
            admin.auth.admin.getUserById(ownerId).catch(() => null),
          ]);
          const renterEmail = extractAuthEmail(renterAuth);
          const hostEmail = extractAuthEmail(hostAuth);
          if (renterEmail) {
            const email = buildBookingCancelledEmail({
              recipientRole: "renter",
              carTitle,
              startDate: booking.start_date,
              endDate: booking.end_date,
              totalPrice: total,
              refundAmount: willRefund ? refundAmount : 0,
              policyLabel,
              bookingId: booking.id,
            });
            await sendEmailSafe({
              to: renterEmail,
              ...email,
              idempotencyKey: `booking:${booking.id}:cancelled-renter`,
            });
          }
          if (hostEmail) {
            const email = buildBookingCancelledEmail({
              recipientRole: "host",
              carTitle,
              startDate: booking.start_date,
              endDate: booking.end_date,
              totalPrice: total,
              refundAmount: willRefund ? refundAmount : 0,
              policyLabel,
              bookingId: booking.id,
            });
            await sendEmailSafe({
              to: hostEmail,
              ...email,
              idempotencyKey: `booking:${booking.id}:cancelled-host`,
            });
          }
        } catch (emailError) {
          console.error("[bookings/:id] cancel email failed", emailError);
        }
      }

      try {
        await sendPushNotificationsToUsers({
          adminClient: admin,
          userIds: [String(ownerId ?? "")],
          title: "Booking cancelled",
          body: `${carTitle ?? "A booking"} was cancelled by the guest. Those dates are open again.`,
          collapseId: `booking:${booking.id}:status`,
          preferenceKey: "booking_updates",
          notificationCategory: "booking_updates",
          data: {
            type: "booking_status",
            bookingId: String(booking.id),
            carId: String(booking.car_id ?? ""),
            status: "cancelled",
          },
        });
      } catch (pushError) {
        console.error("[bookings/:id] cancel push failed", pushError);
      }

      return NextResponse.json({
        data: cancelled,
        refundAmount: willRefund ? refundAmount : 0,
        policy: policyLabel,
      });
    }

    // ---- Host approve / reject (host only) ----
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

    // reject path — claim atomically first so a duplicate request can't
    // trigger a second refund, then refund once (only if actually paid).
    const wasPaid =
      booking.payment_status === "paid" &&
      booking.payment_provider === "paystack" &&
      Boolean(booking.payment_reference);

    const { data, error } = await db
      .from("bookings")
      .update({
        status: "rejected",
        payment_status: wasPaid ? "refunded" : booking.payment_status,
        refund_reference: wasPaid ? booking.payment_reference : null,
        rejected_at: new Date().toISOString(),
        rejection_reason: payload?.reason ?? "Rejected by host",
      })
      .eq("id", id)
      .eq("status", "awaiting_host")
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json(
        { message: "Booking already processed." },
        { status: 409 },
      );
    }

    if (wasPaid) {
      try {
        await refundPaystack(booking.payment_reference);
      } catch (refundError) {
        console.error(
          "[bookings/:id] CRITICAL: refund failed after reject — manual refund required",
          { reference: booking.payment_reference, refundError },
        );
        try {
          await db
            .from("bookings")
            .update({ payment_status: "refund_failed" })
            .eq("id", id);
        } catch {
          /* best effort */
        }
      }
    }

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
  } catch (error) {
    return failJson({
      error,
      req,
      route: "/api/bookings/[id]",
      status: 400,
      userMessage: "Couldn't update the booking. Please try again.",
    });
  }
}
