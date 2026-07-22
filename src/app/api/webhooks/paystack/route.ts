import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { differenceInCalendarDays } from "date-fns";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { refundPaystack, verifyPaystackTransaction } from "@/lib/paystack";
import { isLocationOutsideAccra, isOutsideListingRegion } from "@/lib/utils";
import {
  buildBookingInvoiceEmail,
  buildBookingPaidEmail,
  buildHostBookingNoticeEmail,
  sendEmailSafe,
  sendRefundReceiptEmails,
} from "@/lib/email";
import { sendPushNotificationsToUsers } from "@/lib/push";

// Paystack webhook backstop.
//
// The browser/app calls /api/bookings/paystack to finalize after payment, but
// that client callback is fragile (closed tab, killed app, dropped deep link,
// MoMo latency). Without a server-side backstop a captured charge with a lost
// callback leaves the renter debited with NO booking and NO refund. This
// endpoint is Paystack's server-to-server guarantee: on charge.success it
// confirms the held booking, or refunds if it cannot — so money never
// disappears. It is idempotent and safe to receive multiple times.

export const dynamic = "force-dynamic";

const BLOCKING_STATUSES = ["pending", "awaiting_host", "confirmed"];

function metadataValue(metadata: any, key: string): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function extractAuthEmail(result: any): string | null {
  return (
    result?.data?.user?.email ?? result?.user?.email ?? result?.email ?? null
  );
}

function signatureMatches(rawBody: string, header: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !header) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(header, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  // Always read the RAW body first — the HMAC is computed over the exact bytes.
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!signatureMatches(rawBody, signature)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  // Acknowledge everything else quickly so Paystack does not retry.
  if (event?.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const admin = (() => {
    try {
      return createSupabaseAdminClient() as any;
    } catch {
      return null;
    }
  })();
  if (!admin) {
    // Without the service role we cannot reconcile; tell Paystack to retry.
    return NextResponse.json(
      { message: "Service unavailable" },
      { status: 503 },
    );
  }

  const data = event?.data ?? {};
  const reference = String(data?.reference ?? "").trim();
  if (!reference) {
    return NextResponse.json({ received: true });
  }
  const bookingId = metadataValue(data?.metadata, "bookingId");

  // Official receipt for an automatic refund (best effort, never throws).
  const sendAutoRefundReceipt = async (params: {
    renterId?: string | null;
    fallbackEmail?: string | null;
    carTitle?: string | null;
    bookingId?: string | null;
    amountMinor?: number | null;
    startDate?: string | null;
    endDate?: string | null;
  }) => {
    try {
      let renterEmail = params.fallbackEmail ?? null;
      if (params.renterId) {
        const auth = await admin.auth.admin
          .getUserById(params.renterId)
          .catch(() => null);
        renterEmail = extractAuthEmail(auth) ?? renterEmail;
      }
      if (!renterEmail) return;
      const amountMajor = Number(params.amountMinor ?? 0) / 100;
      await sendRefundReceiptEmails({
        renterEmail,
        carTitle: params.carTitle ?? null,
        bookingId: params.bookingId ?? null,
        paymentReference: reference,
        refundReference: reference,
        refundAmount: amountMajor,
        totalPaid: amountMajor,
        reason:
          "Payment could not be applied to your booking and was automatically refunded in full",
        startDate: params.startDate ?? null,
        endDate: params.endDate ?? null,
      });
    } catch (receiptError) {
      console.error(
        "[webhooks/paystack] auto-refund receipt email failed",
        receiptError,
      );
    }
  };

  const refundUnmatched = async (cause: string) => {
    try {
      await refundPaystack(reference);
      await sendAutoRefundReceipt({
        fallbackEmail:
          typeof data?.customer?.email === "string"
            ? data.customer.email
            : null,
        amountMinor: Number(data?.amount ?? 0),
      });
    } catch (refundError) {
      console.error(
        "[webhooks/paystack] AUTO-REFUND FAILED — manual refund required",
        { reference, cause, refundError },
      );
    }
  };

  // Atomically claim a booking, then refund once. A concurrent finalize/webhook
  // updates 0 rows (its `.neq('payment_status','refunded')` no longer matches)
  // and skips its own refund, preventing a double refund.
  const claimAndRefund = async (
    claimId: string,
    cause: string,
    receiptCtx?: {
      renterId?: string | null;
      carTitle?: string | null;
      amountMinor?: number | null;
      startDate?: string | null;
      endDate?: string | null;
    },
  ) => {
    const { data: claimed } = await admin
      .from("bookings")
      .update({
        status: "cancelled",
        payment_status: "refunded",
        refund_reference: reference,
        hold_expires_at: null,
      })
      .eq("id", claimId)
      .neq("payment_status", "refunded")
      .select("id")
      .maybeSingle();
    if (!claimed) return;
    try {
      await refundPaystack(reference);
      await sendAutoRefundReceipt({
        renterId: receiptCtx?.renterId ?? null,
        fallbackEmail:
          typeof data?.customer?.email === "string"
            ? data.customer.email
            : null,
        carTitle: receiptCtx?.carTitle ?? null,
        bookingId: claimId,
        amountMinor: receiptCtx?.amountMinor ?? Number(data?.amount ?? 0),
        startDate: receiptCtx?.startDate ?? null,
        endDate: receiptCtx?.endDate ?? null,
      });
    } catch (refundError) {
      console.error(
        "[webhooks/paystack] AUTO-REFUND FAILED — manual refund required",
        { reference, cause, refundError },
      );
      try {
        await admin
          .from("bookings")
          .update({ payment_status: "refund_failed" })
          .eq("id", claimId);
      } catch (markError) {
        console.error(
          "[webhooks/paystack] failed to mark refund_failed",
          markError,
        );
      }
    }
  };

  try {
    // Locate the booking this charge belongs to.
    let booking: any = null;
    if (bookingId) {
      const { data: row } = await admin
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();
      booking = row ?? null;
    }
    if (!booking) {
      const { data: row } = await admin
        .from("bookings")
        .select("*")
        .eq("payment_reference", reference)
        .maybeSingle();
      booking = row ?? null;
    }

    if (!booking) {
      // A captured charge we cannot match to any booking must be refunded.
      await refundUnmatched("no matching booking");
      return NextResponse.json({ received: true, refunded: true });
    }

    // Idempotency: this exact charge (or its refund) was already handled.
    const sameReference =
      String(booking.payment_reference ?? "") === reference ||
      String(booking.refund_reference ?? "") === reference;
    const finalized =
      booking.payment_status === "paid" ||
      booking.payment_status === "refunded" ||
      ["confirmed", "awaiting_host", "completed", "rejected", "refunded"].includes(
        String(booking.status),
      );
    if (finalized && sameReference) {
      return NextResponse.json({ received: true, alreadyHandled: true });
    }

    // Authoritatively re-verify the charge with Paystack (don't trust payload).
    let tx: any;
    try {
      tx = await verifyPaystackTransaction(reference);
    } catch {
      // Not actually successful yet — nothing to confirm.
      return NextResponse.json({ received: true });
    }

    if (finalized) {
      // A DIFFERENT captured charge for an already-finalized booking is stray
      // money (e.g. a double payment after a transient finalize failure).
      // Refund the stray charge and leave the booking untouched.
      await refundUnmatched("duplicate charge for finalized booking");
      return NextResponse.json({ received: true, refunded: true });
    }

    if (booking.status !== "pending") {
      // Dead hold (expired or cancelled) whose charge was captured late — the
      // renter paid for a booking that can no longer be confirmed. Refund.
      await claimAndRefund(
        booking.id,
        "charge captured for non-pending booking",
        {
          renterId: booking.renter_id,
          amountMinor: Number(tx?.amount ?? data?.amount ?? 0),
          startDate: booking.start_date,
          endDate: booking.end_date,
        },
      );
      return NextResponse.json({ received: true, refunded: true });
    }

    const { data: car } = await admin
      .from("cars")
      .select(
        "id,title,daily_price,owner_id,instant_book,is_available,approval_status,region,delivery_fee,insurance_fee,deposit_amount,outside_accra_fee",
      )
      .eq("id", booking.car_id)
      .maybeSingle();
    if (!car) {
      await claimAndRefund(booking.id, "car not found", {
        renterId: booking.renter_id,
        amountMinor: Number(tx?.amount ?? data?.amount ?? 0),
        startDate: booking.start_date,
        endDate: booking.end_date,
      });
      return NextResponse.json({ received: true, refunded: true });
    }

    // Recompute the authoritative total exactly as the initiate/finalize path
    // does, then assert the captured amount + currency match.
    const nights = Math.max(
      differenceInCalendarDays(
        new Date(booking.end_date),
        new Date(booking.start_date),
      ),
      1,
    );
    const subtotal = Number(car.daily_price ?? 0) * nights;
    const { data: settings } = await admin
      .from("platform_settings")
      .select("platform_fee_percent")
      .eq("id", 1)
      .maybeSingle();
    const envPlatformFee = Number(
      process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT ??
        process.env.PLATFORM_FEE_PERCENT ??
        "10",
    );
    const platformFeePercent = Number(
      settings?.platform_fee_percent ??
        (Number.isFinite(envPlatformFee) ? envPlatformFee : 10),
    );
    const platformFee = subtotal * (Math.max(platformFeePercent, 0) / 100);
    const insuranceFee = Math.max(Number(car.insurance_fee ?? 0), 0);
    const deliveryFee = String(booking.delivery_address ?? "").trim()
      ? Math.max(Number(car.delivery_fee ?? 0), 0)
      : 0;
    const depositAmount = Math.max(Number(car.deposit_amount ?? 0), 0);
    const tripOutsideListingRegion = isOutsideListingRegion({
      tripRegion: String(booking.trip_use_region ?? ""),
      listingRegion: car.region ?? null,
    });
    const heldSurcharge = Number(booking.outside_accra_surcharge);
    const outsideAccraSurcharge = Number.isFinite(heldSurcharge)
      ? Math.max(heldSurcharge, 0)
      : tripOutsideListingRegion
        ? Math.max(Number(car.outside_accra_fee ?? 0), 0)
        : 0;
    const total =
      subtotal +
      platformFee +
      insuranceFee +
      deliveryFee +
      outsideAccraSurcharge +
      depositAmount;
    const expectedAmount = Math.round(total * 100);

    if (
      tx.status !== "success" ||
      tx.amount !== expectedAmount ||
      String(tx.currency ?? "GHS").toUpperCase() !== "GHS"
    ) {
      await claimAndRefund(
        booking.id,
        `verification mismatch: status=${tx.status} amount=${tx.amount} expected=${expectedAmount} currency=${tx.currency}`,
        {
          renterId: booking.renter_id,
          carTitle: car.title ?? null,
          amountMinor: Number(tx?.amount ?? data?.amount ?? 0),
          startDate: booking.start_date,
          endDate: booking.end_date,
        },
      );
      return NextResponse.json({ received: true, refunded: true });
    }

    // Re-check availability — another renter may have confirmed these dates.
    const { data: conflicts } = await admin
      .from("bookings")
      .select("id,status,hold_expires_at")
      .eq("car_id", booking.car_id)
      .in("status", BLOCKING_STATUSES)
      .lt("start_date", booking.end_date)
      .gt("end_date", booking.start_date)
      .neq("id", booking.id);
    const activeConflicts = (conflicts ?? []).filter(
      (row: any) =>
        row.status !== "pending" ||
        !row.hold_expires_at ||
        new Date(row.hold_expires_at) > new Date(),
    );
    if (activeConflicts.length > 0) {
      await claimAndRefund(booking.id, "dates already taken", {
        renterId: booking.renter_id,
        carTitle: car.title ?? null,
        amountMinor: Number(tx?.amount ?? data?.amount ?? 0),
        startDate: booking.start_date,
        endDate: booking.end_date,
      });
      return NextResponse.json({ received: true, refunded: true });
    }

    const finalStatus = car.instant_book ? "confirmed" : "awaiting_host";
    const approvedAt = car.instant_book ? new Date().toISOString() : null;
    const tripOutsideAccra =
      typeof booking.trip_outside_accra === "boolean"
        ? booking.trip_outside_accra
        : isLocationOutsideAccra({
            region: String(booking.trip_use_region ?? ""),
            city: String(booking.trip_use_city ?? ""),
          });

    // Confirm idempotently: only transition a row that is still pending.
    const { data: confirmed, error: confirmError } = await admin
      .from("bookings")
      .update({
        status: finalStatus,
        total_price: total,
        subtotal,
        nights,
        daily_rate: Number(car.daily_price ?? 0),
        platform_fee: platformFee,
        insurance_fee: insuranceFee,
        delivery_fee: deliveryFee,
        outside_accra_surcharge: outsideAccraSurcharge,
        deposit_amount: depositAmount,
        trip_outside_accra: tripOutsideAccra,
        trip_outside_listing_region: tripOutsideListingRegion,
        payment_status: "paid",
        payment_reference: reference,
        payment_provider: "paystack",
        paid_at: new Date().toISOString(),
        approved_at: approvedAt,
        hold_expires_at: null,
      })
      .eq("id", booking.id)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    if (confirmError || !confirmed) {
      // Could be a real overlap-trigger failure, OR the client finalize already
      // confirmed this booking a moment earlier. Only refund if it is NOT now a
      // valid confirmed booking; otherwise this is a no-op (idempotent).
      const { data: current } = await admin
        .from("bookings")
        .select("status,payment_status,payment_reference")
        .eq("id", booking.id)
        .maybeSingle();
      const alreadyConfirmed =
        current &&
        ["confirmed", "awaiting_host", "completed"].includes(
          String(current.status),
        ) &&
        String(current.payment_reference ?? "") === reference;
      if (alreadyConfirmed) {
        return NextResponse.json({ received: true, alreadyHandled: true });
      }
      await claimAndRefund(
        booking.id,
        confirmError ? String(confirmError.message) : "no pending row to confirm",
        {
          renterId: booking.renter_id,
          carTitle: car.title ?? null,
          amountMinor: Number(tx?.amount ?? data?.amount ?? 0),
          startDate: booking.start_date,
          endDate: booking.end_date,
        },
      );
      return NextResponse.json({ received: true, refunded: true });
    }

    // Ensure a conversation exists between renter and host.
    let conversationId: string | null = null;
    try {
      const { data: existingConvo } = await admin
        .from("conversations")
        .select("id")
        .eq("host_id", car.owner_id)
        .eq("user_id", confirmed.renter_id)
        .eq("car_id", booking.car_id)
        .maybeSingle();
      if (existingConvo?.id) {
        conversationId = existingConvo.id;
        await admin
          .from("conversations")
          .update({ booking_id: confirmed.id })
          .eq("id", existingConvo.id);
      } else {
        const { data: convo } = await admin
          .from("conversations")
          .insert({
            host_id: car.owner_id,
            user_id: confirmed.renter_id,
            car_id: booking.car_id,
            booking_id: confirmed.id,
          })
          .select("id")
          .maybeSingle();
        conversationId = convo?.id ?? null;
      }
    } catch (convoError) {
      console.error("[webhooks/paystack] conversation upsert failed", convoError);
    }

    // Best-effort notifications (never block the confirmation).
    try {
      const [renterAuth, hostAuth, renterProfile, hostProfile] =
        await Promise.all([
          admin.auth.admin.getUserById(confirmed.renter_id).catch(() => null),
          admin.auth.admin.getUserById(car.owner_id).catch(() => null),
          admin
            .from("profiles")
            .select("full_name,phone")
            .eq("id", confirmed.renter_id)
            .maybeSingle(),
          admin
            .from("profiles")
            .select("full_name")
            .eq("id", car.owner_id)
            .maybeSingle(),
        ]);
      const renterEmail = extractAuthEmail(renterAuth);
      const hostEmail = extractAuthEmail(hostAuth);
      const renterName = (renterProfile as any)?.data?.full_name ?? "Guest";
      const hostName = (hostProfile as any)?.data?.full_name ?? "Host";
      const renterPhone = (renterProfile as any)?.data?.phone ?? null;
      const tripUseLocationLine = [
        String(booking.trip_use_address ?? "").trim(),
        String(booking.trip_use_city ?? "").trim(),
        String(booking.trip_use_region ?? "").trim(),
      ]
        .filter(Boolean)
        .join(", ");
      const invoiceBase = {
        carTitle: car.title ?? null,
        bookingId: confirmed.id as string,
        paymentReference: reference,
        bookedAt: confirmed.paid_at ?? new Date().toISOString(),
        startDate: booking.start_date,
        endDate: booking.end_date,
        nights,
        dailyRate: Number(car.daily_price ?? 0),
        subtotal,
        platformFee,
        insuranceFee,
        deliveryFee,
        outsideAccraSurcharge,
        depositAmount,
        totalPrice: total,
        status: finalStatus,
        conversationUrl: null,
        tripUseLocation: tripUseLocationLine || null,
      };

      if (renterEmail) {
        const email = buildBookingPaidEmail({
          instantBook: car.instant_book,
          carTitle: car.title ?? null,
          startDate: booking.start_date,
          endDate: booking.end_date,
          totalPrice: total,
          bookingId: confirmed.id,
          paymentReference: reference,
          bookedAt: confirmed.paid_at ?? new Date().toISOString(),
          conversationUrl: null,
          tripUseLocation: tripUseLocationLine || null,
        });
        await sendEmailSafe({
          to: renterEmail,
          ...email,
          idempotencyKey: `booking:${confirmed.id}:renter-paid`,
        });
      }
      if (hostEmail) {
        const email = buildHostBookingNoticeEmail({
          instantBook: car.instant_book,
          renterName,
          renterPhone,
          carTitle: car.title ?? null,
          startDate: booking.start_date,
          endDate: booking.end_date,
          totalPrice: total,
          bookingId: confirmed.id,
          paymentReference: reference,
          bookedAt: confirmed.paid_at ?? new Date().toISOString(),
          conversationUrl: null,
          tripUseLocation: tripUseLocationLine || null,
        });
        await sendEmailSafe({
          to: hostEmail,
          ...email,
          idempotencyKey: `booking:${confirmed.id}:host-notice`,
        });
      }
      // Official invoices to both parties. Same idempotency keys as the
      // client finalize path, so whichever path runs first sends them and
      // the other is deduplicated by Resend.
      if (renterEmail) {
        const invoice = buildBookingInvoiceEmail({
          recipientRole: "renter",
          recipientName: renterName,
          counterpartName: hostName,
          ...invoiceBase,
        });
        await sendEmailSafe({
          to: renterEmail,
          ...invoice,
          idempotencyKey: `booking:${confirmed.id}:invoice:renter`,
        });
      }
      if (hostEmail) {
        const invoice = buildBookingInvoiceEmail({
          recipientRole: "host",
          recipientName: hostName,
          counterpartName: renterName,
          ...invoiceBase,
        });
        await sendEmailSafe({
          to: hostEmail,
          ...invoice,
          idempotencyKey: `booking:${confirmed.id}:invoice:host`,
        });
      }
    } catch (emailError) {
      console.error("[webhooks/paystack] email notifications failed", emailError);
    }

    try {
      const isInstant = finalStatus === "confirmed";
      await sendPushNotificationsToUsers({
        adminClient: admin,
        userIds: [String(car.owner_id ?? "")],
        title: isInstant ? "New instant booking" : "New booking request",
        body: isInstant
          ? `${car.title ?? "Your car"} has been booked and confirmed.`
          : `${car.title ?? "Your car"} has a new request awaiting your approval.`,
        collapseId: `booking:${confirmed.id}`,
        preferenceKey: "booking_updates",
        notificationCategory: "booking_updates",
        data: {
          type: "booking",
          bookingId: String(confirmed.id),
          carId: String(booking.car_id),
          conversationId,
          status: finalStatus,
          recipientRole: "host",
        },
      });
      await sendPushNotificationsToUsers({
        adminClient: admin,
        userIds: [String(confirmed.renter_id ?? "")],
        title: isInstant ? "Booking confirmed" : "Booking request sent",
        body: isInstant
          ? `Your trip for ${car.title ?? "your booking"} is confirmed.`
          : `Your request for ${car.title ?? "your booking"} is awaiting host approval.`,
        collapseId: `booking:${confirmed.id}`,
        preferenceKey: "booking_updates",
        notificationCategory: "booking_updates",
        data: {
          type: "booking",
          bookingId: String(confirmed.id),
          carId: String(booking.car_id),
          conversationId,
          status: finalStatus,
          recipientRole: "renter",
        },
      });
    } catch (pushError) {
      console.error("[webhooks/paystack] push notifications failed", pushError);
    }

    return NextResponse.json({ received: true, confirmed: true });
  } catch (error: any) {
    console.error("[webhooks/paystack] handler error", error);
    // Tell Paystack to retry rather than silently dropping a real charge.
    return NextResponse.json(
      { message: error?.message ?? "Webhook error" },
      { status: 500 },
    );
  }
}
