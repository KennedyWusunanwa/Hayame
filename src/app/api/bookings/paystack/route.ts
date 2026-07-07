import { NextResponse } from "next/server";
import { differenceInCalendarDays } from "date-fns";
import { failJson } from "@/lib/api-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { verifyPaystackTransaction, refundPaystack } from "@/lib/paystack";
import { isLocationOutsideAccra, isOutsideListingRegion } from "@/lib/utils";
import {
  buildBookingInvoiceEmail,
  buildBookingPaidEmail,
  buildHostBookingNoticeEmail,
  sendEmailSafe,
  sendRefundReceiptEmails,
} from "@/lib/email";
import { sendPushNotificationsToUsers } from "@/lib/push";

type Body = {
  carId?: string;
  startDate?: string;
  endDate?: string;
  tripMode?: "pickup" | "delivery";
  tripUseRegion?: string;
  tripUseCity?: string;
  tripUseAddress?: string;
  deliveryAddress?: string;
  deliveryTime?: string;
  contactPhone?: string;
  deliveryNotes?: string;
  tripOutsideAccra?: boolean;
  reference?: string;
  amount?: number;
  bookingId?: string;
};

const BLOCKING_STATUSES = ["pending", "awaiting_host", "confirmed"];
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.EMAIL_BASE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

function extractAuthEmail(result: any): string | null {
  return (
    result?.data?.user?.email ?? result?.user?.email ?? result?.email ?? null
  );
}

function metadataValue(metadata: any, key: string): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function ensureBookingConversation(params: {
  primaryClient: any;
  fallbackClient?: any;
  hostId: string;
  userId: string;
  carId: string;
  bookingId: string;
}) {
  const upsertOn = async (client: any) => {
    const { data: existing } = await client
      .from("conversations")
      .select("id,booking_id")
      .eq("host_id", params.hostId)
      .eq("user_id", params.userId)
      .eq("car_id", params.carId)
      .maybeSingle();

    if (existing?.id) {
      if ((existing as any).booking_id !== params.bookingId) {
        await client
          .from("conversations")
          .update({ booking_id: params.bookingId })
          .eq("id", existing.id);
      }
      return existing.id as string;
    }

    const { data, error } = await client
      .from("conversations")
      .insert({
        host_id: params.hostId,
        user_id: params.userId,
        car_id: params.carId,
        booking_id: params.bookingId,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data?.id as string;
  };

  try {
    return await upsertOn(params.primaryClient);
  } catch {
    if (params.fallbackClient) {
      try {
        return await upsertOn(params.fallbackClient);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const user = await getRequestUser(supabase as any, req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    // Privileged (service-role) client for all booking money/status writes.
    // The DB guard trigger (db/launch_security_hardening.sql) rejects these
    // column changes from the anon/authenticated role, so every confirm,
    // cancel, and refund transition must run through the service role.
    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();
    const writeDb = admin ?? supa;

    // Ensure profile exists for renter_id FK
    await supa.from("profiles").upsert(
      {
        id: user.id,
        full_name: (user.user_metadata as any)?.full_name ?? user.email ?? null,
        first_name: (user.user_metadata as any)?.first_name ?? null,
        last_name: (user.user_metadata as any)?.last_name ?? null,
        city: (user.user_metadata as any)?.city ?? null,
        avatar_url: (user.user_metadata as any)?.avatar_url ?? null,
      },
      { onConflict: "id" },
    );

    const body = (await req.json()) as Body;
    const { reference, amount, bookingId } = body;
    let { carId, startDate, endDate } = body;
    let { tripUseRegion, tripUseCity, tripUseAddress } = body;
    let {
      deliveryAddress,
      deliveryTime,
      contactPhone,
      deliveryNotes,
    } = body;
    let heldBooking: any = null;
    if (!reference || !amount) {
      return NextResponse.json(
        { message: "Missing booking or payment details" },
        { status: 400 },
      );
    }

    if (bookingId) {
      const { data: booking, error: bookingError } = await supa
        .from("bookings")
        .select(
          "id,car_id,renter_id,start_date,end_date,status,hold_expires_at,trip_use_region,trip_use_city,trip_use_address,delivery_address,delivery_time,contact_phone,delivery_notes,trip_outside_accra,trip_outside_listing_region,outside_accra_surcharge,payment_reference,payment_provider",
        )
        .eq("id", bookingId)
        .single();
      if (bookingError || !booking) {
        return NextResponse.json(
          { message: "Booking hold not found" },
          { status: 404 },
        );
      }
      if (booking.renter_id !== user.id) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      if (booking.status !== "pending") {
        // The Paystack webhook may have already confirmed this booking before
        // the client callback arrived. Treat that as success (idempotent)
        // instead of a confusing "hold expired" error.
        if (
          ["confirmed", "awaiting_host"].includes(String(booking.status)) &&
          String(booking.payment_reference ?? "") === reference.trim()
        ) {
          return NextResponse.json({ data: booking, alreadyConfirmed: true });
        }
        return NextResponse.json(
          { message: "Booking hold is no longer valid" },
          { status: 400 },
        );
      }
      if (
        booking.hold_expires_at &&
        new Date(booking.hold_expires_at) <= new Date()
      ) {
        await writeDb
          .from("bookings")
          .update({
            status: "cancelled",
            payment_status: "failed",
            hold_expires_at: null,
          })
          .eq("id", bookingId);
        return NextResponse.json(
          { message: "Booking hold expired" },
          { status: 409 },
        );
      }
      const expectedReference = String(booking.payment_reference ?? "").trim();
      const expectedProvider = String(booking.payment_provider ?? "").trim();
      if (!expectedReference) {
        const { error: bindReferenceError } = await writeDb
          .from("bookings")
          .update({
            payment_reference: reference.trim(),
            payment_provider: "paystack",
            payment_status: "pending",
          })
          .eq("id", bookingId)
          .eq("status", "pending")
          .is("payment_reference", null)
          .select("id")
          .single();

        if (bindReferenceError) {
          return NextResponse.json(
            {
              message:
                "Payment session was not initialized. Open secure checkout again before verifying.",
            },
            { status: 400 },
          );
        }
      } else if (expectedReference !== reference.trim()) {
        return NextResponse.json(
          {
            message:
              "This payment session is no longer current. Open secure checkout again before verifying.",
          },
          { status: 400 },
        );
      }
      if (expectedProvider && expectedProvider !== "paystack") {
        return NextResponse.json(
          { message: "This booking is not waiting for a Paystack payment." },
          { status: 400 },
        );
      }
      heldBooking = booking;
      carId = booking.car_id;
      startDate = booking.start_date;
      endDate = booking.end_date;
      tripUseRegion = booking.trip_use_region ?? tripUseRegion;
      tripUseCity = booking.trip_use_city ?? tripUseCity;
      tripUseAddress = booking.trip_use_address ?? tripUseAddress;
      deliveryAddress = booking.delivery_address ?? deliveryAddress;
      deliveryTime = booking.delivery_time ?? deliveryTime;
      contactPhone = booking.contact_phone ?? contactPhone;
      deliveryNotes = booking.delivery_notes ?? deliveryNotes;
      body.tripOutsideAccra =
        typeof booking.trip_outside_accra === "boolean"
          ? booking.trip_outside_accra
          : body.tripOutsideAccra;
    }

    if (!carId || !startDate || !endDate) {
      return NextResponse.json(
        { message: "Missing booking or payment details" },
        { status: 400 },
      );
    }

    const { data: carData, error: carError } = await supa
      .from("cars")
      .select(
        "id,title,daily_price,owner_id,instant_book,is_available,approval_status,city,region,delivery_fee,insurance_fee,deposit_amount,outside_accra_fee",
      )
      .eq("id", carId)
      .single();
    const car = carData as any;
    if (carError || !car) throw carError ?? new Error("Car not found");
    if (car.is_available === false) {
      if (bookingId) {
        await writeDb
          .from("bookings")
          .update({
            status: "cancelled",
            payment_status: "failed",
            hold_expires_at: null,
          })
          .eq("id", bookingId);
      }
      return NextResponse.json(
        { message: "Car is unavailable" },
        { status: 409 },
      );
    }

    if (car.owner_id === user.id) {
      if (bookingId) {
        await writeDb
          .from("bookings")
          .update({
            status: "cancelled",
            payment_status: "failed",
            hold_expires_at: null,
          })
          .eq("id", bookingId);
      }
      return NextResponse.json(
        { message: "You cannot book your own car." },
        { status: 403 },
      );
    }

    if (
      car.approval_status === "pending" ||
      car.approval_status === "rejected"
    ) {
      if (bookingId) {
        await writeDb
          .from("bookings")
          .update({
            status: "cancelled",
            payment_status: "failed",
            hold_expires_at: null,
          })
          .eq("id", bookingId);
      }
      return NextResponse.json(
        { message: "This listing is not available for booking." },
        { status: 409 },
      );
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json(
        { message: "End date must be after start date" },
        { status: 400 },
      );
    }

    tripUseRegion = (tripUseRegion ?? "").trim();
    tripUseCity = (tripUseCity ?? "").trim();
    tripUseAddress = (tripUseAddress ?? "").trim();
    deliveryAddress =
      body.tripMode === "pickup" ? "" : (deliveryAddress ?? "").trim();
    deliveryTime = deliveryAddress ? (deliveryTime ?? "").trim() : "";
    contactPhone = deliveryAddress ? (contactPhone ?? "").trim() : "";
    deliveryNotes = deliveryAddress ? (deliveryNotes ?? "").trim() : "";
    if (!tripUseRegion || !tripUseCity || tripUseAddress.length < 3) {
      if (bookingId) {
        await writeDb
          .from("bookings")
          .update({
            status: "cancelled",
            payment_status: "failed",
            hold_expires_at: null,
          })
          .eq("id", bookingId);
      }
      return NextResponse.json(
        {
          message:
            "Trip use location is required (region, city and exact area).",
        },
        { status: 400 },
      );
    }

    const tripOutsideAccra = isLocationOutsideAccra({
      region: tripUseRegion,
      city: tripUseCity,
    });
    const tripOutsideListingRegion = isOutsideListingRegion({
      tripRegion: tripUseRegion,
      listingRegion: car.region ?? null,
    });

    const conflictClient = admin ?? supa;
    if (admin) {
      const nowIso = new Date().toISOString();
      await admin
        .from("bookings")
        .update({
          status: "cancelled",
          payment_status: "failed",
          hold_expires_at: null,
        })
        .eq("status", "pending")
        .lt("hold_expires_at", nowIso);
    }

    const conflictsQuery = conflictClient
      .from("bookings")
      .select("id,status,hold_expires_at")
      .eq("car_id", carId)
      .in("status", BLOCKING_STATUSES)
      .lt("start_date", endDate)
      .gt("end_date", startDate);
    const { data: conflicts } = bookingId
      ? await conflictsQuery.neq("id", bookingId)
      : await conflictsQuery;

    const activeConflicts = (conflicts ?? []).filter(
      (row: any) =>
        row.status !== "pending" ||
        !row.hold_expires_at ||
        new Date(row.hold_expires_at) > new Date(),
    );
    if (activeConflicts.length > 0) {
      if (bookingId) {
        await writeDb
          .from("bookings")
          .update({
            status: "cancelled",
            payment_status: "failed",
            hold_expires_at: null,
          })
          .eq("id", bookingId);
      }
      return NextResponse.json(
        { message: "Dates not available" },
        { status: 409 },
      );
    }

    const { data: blocked } = await conflictClient
      .from("car_availability")
      .select("id")
      .eq("car_id", carId)
      .eq("available", false)
      .lt("start_date", endDate)
      .gt("end_date", startDate);
    if (blocked && blocked.length > 0) {
      if (bookingId) {
        await writeDb
          .from("bookings")
          .update({
            status: "cancelled",
            payment_status: "failed",
            hold_expires_at: null,
          })
          .eq("id", bookingId);
      }
      return NextResponse.json(
        { message: "Dates not available" },
        { status: 409 },
      );
    }

    const nights = Math.max(
      differenceInCalendarDays(new Date(endDate), new Date(startDate)),
      1,
    );
    const subtotal = Number(car.daily_price ?? 0) * nights;

    const { data: settings } = await supa
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
    const deliveryFee = deliveryAddress
      ? Math.max(Number(car.delivery_fee ?? 0), 0)
      : 0;
    const depositAmount = Math.max(Number(car.deposit_amount ?? 0), 0);
    const heldOutsideAccraSurcharge = Number(
      heldBooking?.outside_accra_surcharge,
    );
    const outsideAccraSurcharge = Number.isFinite(heldOutsideAccraSurcharge)
      ? Math.max(heldOutsideAccraSurcharge, 0)
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

    let tx: any;

    // Once verifyPaystackTransaction succeeds the customer's card HAS been
    // charged. Any reason we then decline to confirm the booking MUST refund
    // the money — otherwise the renter is debited with nothing to show.
    const refundAfterChargeFailure = async (cause: any) => {
      // Atomically claim the booking FIRST so a concurrent finalize/webhook
      // cannot also refund the same charge (the claim flips payment_status to
      // 'refunded'; the loser's `.neq('payment_status','refunded')` matches 0
      // rows and skips its refund).
      if (bookingId) {
        const { data: claimed } = await writeDb
          .from("bookings")
          .update({
            status: "cancelled",
            payment_status: "refunded",
            refund_reference: reference,
            hold_expires_at: null,
          })
          .eq("id", bookingId)
          .neq("payment_status", "refunded")
          .select("id")
          .maybeSingle();
        if (!claimed) return; // another path already refunded this charge
      }
      try {
        await refundPaystack(reference);
        // Official receipt so the renter has a record of the automatic refund.
        try {
          const refundAmountMajor =
            Number(tx?.amount ?? expectedAmount ?? 0) / 100;
          await sendRefundReceiptEmails({
            renterEmail: user.email ?? null,
            carTitle: car?.title ?? null,
            bookingId: bookingId ?? null,
            paymentReference: reference,
            refundReference: reference,
            refundAmount: refundAmountMajor,
            totalPaid: refundAmountMajor,
            reason:
              "Payment could not be applied to your booking and was automatically refunded in full",
            startDate: startDate ?? null,
            endDate: endDate ?? null,
          });
        } catch (receiptError) {
          console.error(
            "[bookings/paystack] auto-refund receipt email failed",
            receiptError,
          );
        }
      } catch (refundError) {
        // Money is still held by Paystack. Persist a durable, queryable state
        // so reconciliation can retry — never leave this to logs alone.
        console.error(
          "[bookings/paystack] AUTO-REFUND FAILED — manual refund required",
          { reference, cause: cause?.message ?? cause, refundError },
        );
        if (bookingId) {
          try {
            await writeDb
              .from("bookings")
              .update({ payment_status: "refund_failed" })
              .eq("id", bookingId);
          } catch (markError) {
            console.error(
              "[bookings/paystack] failed to mark refund_failed",
              markError,
            );
          }
        }
      }
    };

    try {
      tx = await verifyPaystackTransaction(reference);
    } catch {
      return NextResponse.json(
        {
          message:
            "Payment not completed yet. Finish payment in secure checkout before verifying.",
        },
        { status: 400 },
      );
    }
    if (String(tx.reference ?? "") !== reference) {
      await refundAfterChargeFailure("reference mismatch");
      return NextResponse.json(
        {
          message:
            "Payment reference mismatch. Your payment has been refunded.",
          refunded: true,
        },
        { status: 400 },
      );
    }
    const txBookingId = metadataValue(tx.metadata, "bookingId");
    if (bookingId && txBookingId !== null && txBookingId !== bookingId) {
      await refundAfterChargeFailure("booking metadata mismatch");
      return NextResponse.json(
        {
          message:
            "Payment does not match this booking. Your payment has been refunded.",
          refunded: true,
        },
        { status: 400 },
      );
    }
    if (tx.amount !== expectedAmount) {
      await refundAfterChargeFailure(
        `amount mismatch: charged ${tx.amount} expected ${expectedAmount}`,
      );
      return NextResponse.json(
        {
          message:
            "Payment amount mismatch. Your payment has been refunded — please try again.",
          refunded: true,
        },
        { status: 400 },
      );
    }
    if (String(tx.currency ?? "GHS").toUpperCase() !== "GHS") {
      await refundAfterChargeFailure(`currency mismatch: ${tx.currency}`);
      return NextResponse.json(
        {
          message: "Payment currency mismatch. Your payment has been refunded.",
          refunded: true,
        },
        { status: 400 },
      );
    }
    if (tx.status !== "success") {
      if (bookingId) {
        await writeDb
          .from("bookings")
          .update({
            status: "cancelled",
            payment_status: "failed",
            hold_expires_at: null,
          })
          .eq("id", bookingId);
      }
      return NextResponse.json(
        { message: "Payment not successful" },
        { status: 400 },
      );
    }

    const finalStatus = car.instant_book ? "confirmed" : "awaiting_host";
    const approvedAt = car.instant_book ? new Date().toISOString() : null;
    const tripUseLocationLine = [tripUseAddress, tripUseCity, tripUseRegion]
      .filter(Boolean)
      .join(", ");
    const maybeAdmin = admin;

    // Note: booked dates are blocked by the booking row itself (the
    // availability check and the DB overlap trigger both read active bookings),
    // so we intentionally do NOT insert a separate car_availability block here.
    // Doing so previously orphaned available=false rows that were never cleaned
    // up on reject/cancel, permanently blocking the calendar.

    const sendBookingEmails = async (
      booking: any,
      conversationId: string | null,
    ) => {
      if (!maybeAdmin) return;
      try {
        const renterId = booking.renter_id;
        const hostId = car.owner_id;
        const [
          renterAuthResult,
          hostAuthResult,
          renterProfileResult,
          hostProfileResult,
        ] = await Promise.all([
          maybeAdmin.auth.admin.getUserById(renterId).catch(() => null),
          maybeAdmin.auth.admin.getUserById(hostId).catch(() => null),
          maybeAdmin
            .from("profiles")
            .select("full_name,phone")
            .eq("id", renterId)
            .maybeSingle(),
          maybeAdmin
            .from("profiles")
            .select("full_name,phone")
            .eq("id", hostId)
            .maybeSingle(),
        ]);

        const renterEmail = extractAuthEmail(renterAuthResult);
        const hostEmail = extractAuthEmail(hostAuthResult);
        const renterProfile = (renterProfileResult as any)?.data ?? null;
        const hostProfile = (hostProfileResult as any)?.data ?? null;
        const renterName = renterProfile?.full_name ?? "Guest";
        const hostName = hostProfile?.full_name ?? "Host";
        const renterPhone = renterProfile?.phone ?? null;
        const conversationUrl = conversationId
          ? `${SITE_URL}/messages?conversation=${conversationId}`
          : `${SITE_URL}/messages`;

        if (renterEmail) {
          const email = buildBookingPaidEmail({
            instantBook: car.instant_book,
            carTitle: car.title ?? null,
            startDate,
            endDate,
            totalPrice: total,
            bookingId: booking.id,
            paymentReference: reference,
            bookedAt: booking.paid_at ?? new Date().toISOString(),
            conversationUrl,
            tripUseLocation: tripUseLocationLine,
          });
          await sendEmailSafe({
            to: renterEmail,
            ...email,
            idempotencyKey: `booking:${booking.id}:renter-paid`,
          });
        }

        if (hostEmail) {
          const email = buildHostBookingNoticeEmail({
            instantBook: car.instant_book,
            renterName,
            renterPhone,
            carTitle: car.title ?? null,
            startDate,
            endDate,
            totalPrice: total,
            bookingId: booking.id,
            paymentReference: reference,
            bookedAt: booking.paid_at ?? new Date().toISOString(),
            conversationUrl,
            tripUseLocation: tripUseLocationLine,
          });
          await sendEmailSafe({
            to: hostEmail,
            ...email,
            idempotencyKey: `booking:${booking.id}:host-notice`,
          });
        }

        if (renterEmail) {
          const invoice = buildBookingInvoiceEmail({
            recipientRole: "renter",
            recipientName: renterName,
            counterpartName: hostName,
            carTitle: car.title ?? null,
            bookingId: booking.id,
            paymentReference: reference,
            bookedAt: booking.paid_at ?? new Date().toISOString(),
            startDate,
            endDate,
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
            conversationUrl,
            tripUseLocation: tripUseLocationLine,
          });
          await sendEmailSafe({
            to: renterEmail,
            ...invoice,
            idempotencyKey: `booking:${booking.id}:invoice:renter`,
          });
        }

        if (hostEmail) {
          const invoice = buildBookingInvoiceEmail({
            recipientRole: "host",
            recipientName: hostName,
            counterpartName: renterName,
            carTitle: car.title ?? null,
            bookingId: booking.id,
            paymentReference: reference,
            bookedAt: booking.paid_at ?? new Date().toISOString(),
            startDate,
            endDate,
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
            conversationUrl,
            tripUseLocation: tripUseLocationLine,
          });
          await sendEmailSafe({
            to: hostEmail,
            ...invoice,
            idempotencyKey: `booking:${booking.id}:invoice:host`,
          });
        }
      } catch (emailError) {
        console.error(
          "[bookings/paystack] email notifications failed",
          emailError,
        );
      }
    };

    const sendBookingPushNotifications = async (
      booking: any,
      conversationId: string | null,
    ) => {
      try {
        const bookingIdValue = String(booking?.id ?? "");
        const carTitle = String(car.title ?? "your trip");
        const isInstantBook = finalStatus === "confirmed";
        const hostUserId = String(car.owner_id ?? "");
        const renterUserId = String(booking?.renter_id ?? user.id ?? "");
        const sharedData = {
          type: "booking",
          bookingId: bookingIdValue,
          carId: String(carId ?? ""),
          conversationId: conversationId ?? null,
          status: finalStatus,
        } as const;

        if (hostUserId) {
          const hostPushResult = await sendPushNotificationsToUsers({
            adminClient: maybeAdmin,
            userIds: [hostUserId],
            title: isInstantBook
              ? "New instant booking"
              : "New booking request",
            body: isInstantBook
              ? `${carTitle} has been booked and confirmed.`
              : `${carTitle} has a new request awaiting your approval.`,
            collapseId: bookingIdValue
              ? `booking:${bookingIdValue}`
              : "booking:new",
            preferenceKey: "booking_updates",
            notificationCategory: "booking_updates",
            data: {
              ...sharedData,
              recipientRole: "host",
            },
          });
          if (hostPushResult.skipped || hostPushResult.delivered === 0) {
            console.warn(
              "[bookings/paystack] host push skipped or undelivered",
              hostPushResult,
            );
          }
        }

        if (renterUserId) {
          const renterPushResult = await sendPushNotificationsToUsers({
            adminClient: maybeAdmin,
            userIds: [renterUserId],
            title: isInstantBook ? "Booking confirmed" : "Booking request sent",
            body: isInstantBook
              ? `Your trip for ${carTitle} is confirmed.`
              : `Your request for ${carTitle} is awaiting host approval.`,
            collapseId: bookingIdValue
              ? `booking:${bookingIdValue}`
              : "booking:new",
            preferenceKey: "booking_updates",
            notificationCategory: "booking_updates",
            data: {
              ...sharedData,
              recipientRole: "renter",
            },
          });
          if (renterPushResult.skipped || renterPushResult.delivered === 0) {
            console.warn(
              "[bookings/paystack] renter push skipped or undelivered",
              renterPushResult,
            );
          }
        }
      } catch (pushError) {
        console.error(
          "[bookings/paystack] push notifications failed",
          pushError,
        );
      }
    };

    if (bookingId) {
      const { data, error } = await writeDb
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
          trip_use_region: tripUseRegion,
          trip_use_city: tripUseCity,
          trip_use_address: tripUseAddress,
          delivery_address: deliveryAddress || null,
          delivery_time: deliveryTime || null,
          contact_phone: contactPhone || null,
          delivery_notes: deliveryNotes || null,
          trip_outside_accra: tripOutsideAccra,
          trip_outside_listing_region: tripOutsideListingRegion,
          payment_status: "paid",
          payment_reference: reference,
          payment_provider: "paystack",
          paid_at: new Date().toISOString(),
          approved_at: approvedAt,
          hold_expires_at: null,
        })
        .eq("id", bookingId)
        .eq("payment_reference", reference)
        .eq("status", "pending")
        .select()
        .maybeSingle();
      if (error) {
        // The charge already succeeded; the most common cause here is the DB
        // overlap trigger (errcode 23514) firing because another renter
        // confirmed these dates a moment earlier. Refund so the renter is never
        // left charged with no booking.
        await refundAfterChargeFailure(error);
        const overlap =
          String((error as any)?.code) === "23514" ||
          /overlap/i.test(String((error as any)?.message ?? ""));
        return NextResponse.json(
          {
            message: overlap
              ? "Those dates were just booked by someone else. Your payment has been fully refunded."
              : "We couldn't confirm your booking, so your payment has been refunded. Please try again.",
            refunded: true,
          },
          { status: 409 },
        );
      }
      if (!data) {
        // No pending row was updated — the webhook (or a prior call) already
        // finalized this booking. Re-fetch and return idempotently WITHOUT
        // refunding (the money was correctly applied or already refunded).
        const { data: current } = await writeDb
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .maybeSingle();
        if (
          current &&
          ["confirmed", "awaiting_host"].includes(String(current.status)) &&
          String(current.payment_reference ?? "") === reference.trim()
        ) {
          return NextResponse.json({ data: current, alreadyConfirmed: true });
        }
        return NextResponse.json(
          { message: "This booking was already processed.", data: current ?? null },
          { status: 409 },
        );
      }
      const conversationId = await ensureBookingConversation({
        primaryClient: supa,
        fallbackClient: maybeAdmin,
        hostId: car.owner_id,
        userId: data.renter_id,
        carId,
        bookingId: data.id,
      });
      await sendBookingEmails(data, conversationId);
      await sendBookingPushNotifications(data, conversationId);
      return NextResponse.json({ data, conversationId });
    }

    // Avoid duplicate inserts on refresh (legacy flow)
    const { data: existing } = await supa
      .from("bookings")
      .select("id,status")
      .eq("payment_reference", reference)
      .maybeSingle();
    if (existing?.id) {
      const conversationId = await ensureBookingConversation({
        primaryClient: supa,
        fallbackClient: maybeAdmin,
        hostId: car.owner_id,
        userId: user.id,
        carId,
        bookingId: existing.id,
      });
      return NextResponse.json({ data: existing, conversationId });
    }

    const { data, error } = await writeDb
      .from("bookings")
      .insert({
        car_id: carId,
        renter_id: user.id,
        start_date: startDate,
        end_date: endDate,
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
        trip_use_region: tripUseRegion,
        trip_use_city: tripUseCity,
        trip_use_address: tripUseAddress,
        delivery_address: deliveryAddress || null,
        delivery_time: deliveryTime || null,
        contact_phone: contactPhone || null,
        delivery_notes: deliveryNotes || null,
        trip_outside_accra: tripOutsideAccra,
        trip_outside_listing_region: tripOutsideListingRegion,
        payment_status: "paid",
        payment_reference: reference,
        payment_provider: "paystack",
        paid_at: new Date().toISOString(),
        approved_at: approvedAt,
      })
      .select()
      .single();

    if (error || !data) {
      await refundAfterChargeFailure(error ?? "insert returned no row");
      return NextResponse.json(
        {
          message:
            "We couldn't create your booking, so your payment has been refunded. Please try again.",
          refunded: true,
        },
        { status: 409 },
      );
    }
    const conversationId = await ensureBookingConversation({
      primaryClient: supa,
      fallbackClient: maybeAdmin,
      hostId: car.owner_id,
      userId: data.renter_id,
      carId,
      bookingId: data.id,
    });
    await sendBookingEmails(data, conversationId);
    await sendBookingPushNotifications(data, conversationId);
    return NextResponse.json({ data, conversationId });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/bookings/paystack",
      status: 400,
      userMessage: "We couldn't create your booking. Please try again.",
    });
  }
}
