import "server-only";
import { addMinutes, differenceInCalendarDays } from "date-fns";
import { POST as finalizePaystackBooking } from "@/app/api/bookings/paystack/route";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { isOutsideListingRegion } from "@/lib/utils";

// Resumable checkout.
//
// A renter who starts paying and drops out (closed the Paystack sheet, card
// declined, app killed, MoMo prompt ignored) leaves behind a `bookings` row in
// status=pending with everything they chose: car, dates, pickup/delivery,
// trip area, delivery details. That row IS the saved checkout. These helpers
// find it, re-check every condition that could have changed since (car still
// bookable, dates still free, price), refresh or recreate the 15-minute hold,
// and reconcile a payment that succeeded at Paystack but never reached the
// app's finalize call.

export const BLOCKING_STATUSES = ["pending", "awaiting_host", "confirmed"];
export const HOLD_MINUTES = 15;
/** How long after it was started an unpaid checkout can still be resumed. */
export const RESUMABLE_WINDOW_HOURS = 72;
/** Stored in `rejection_reason` so an abandoned checkout is never offered again. */
export const CHECKOUT_ABANDONED_REASON = "checkout_abandoned_by_renter";
/** Stored on a dead hold once a fresh hold replaced it during resume. */
export const CHECKOUT_SUPERSEDED_REASON = "checkout_superseded";

export const BOOKING_CHECKOUT_SELECT =
  "id,car_id,renter_id,start_date,end_date,status,hold_expires_at,trip_use_region,trip_use_city,trip_use_address,delivery_address,delivery_time,contact_phone,delivery_notes,trip_outside_accra,trip_outside_listing_region,outside_accra_surcharge,payment_status,payment_reference,payment_provider,rejection_reason,created_at";

export const CAR_CHECKOUT_SELECT =
  "id,title,daily_price,owner_id,instant_book,is_available,approval_status,city,region,delivery_available,delivery_fee,insurance_fee,deposit_amount,outside_accra_fee,image_url,car_photos(url),owner:profiles!cars_owner_id_fkey(id,full_name)";

export type CheckoutIssue = { code: string; message: string };

export type CheckoutPricing = {
  nights: number;
  dailyRate: number;
  subtotal: number;
  platformFee: number;
  platformFeePercent: number;
  insuranceFee: number;
  deliveryFee: number;
  outsideAccraSurcharge: number;
  depositAmount: number;
  total: number;
  amountMinor: number;
  currency: "GHS";
};

export type PendingCheckoutDTO = {
  bookingId: string;
  carId: string;
  state: "held" | "expired";
  holdExpiresAt: string | null;
  createdAt: string | null;
  startDate: string;
  endDate: string;
  nights: number;
  tripMode: "pickup" | "delivery";
  tripUseRegion: string;
  tripUseCity: string;
  tripUseAddress: string;
  deliveryAddress: string | null;
  deliveryTime: string | null;
  contactPhone: string | null;
  deliveryNotes: string | null;
  car: {
    id: string;
    title: string;
    imageUrl: string | null;
    dailyPrice: number;
    city: string | null;
    region: string | null;
    instantBook: boolean;
    deliveryAvailable: boolean;
    hostName: string;
  };
  pricing: CheckoutPricing;
  issues: CheckoutIssue[];
  canResume: boolean;
  paymentReference: string | null;
  paymentStatus: string;
};

export function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export function isFinalizedBooking(booking: any) {
  return (
    String(booking?.payment_status ?? "") === "paid" ||
    ["confirmed", "awaiting_host", "completed"].includes(
      String(booking?.status ?? ""),
    )
  );
}

export function isAbandonedCheckout(booking: any) {
  const reason = String(booking?.rejection_reason ?? "").trim();
  return (
    reason === CHECKOUT_ABANDONED_REASON ||
    reason === CHECKOUT_SUPERSEDED_REASON
  );
}

export function isHoldActive(booking: any, now = new Date()) {
  if (String(booking?.status ?? "") !== "pending") return false;
  const expires = booking?.hold_expires_at
    ? new Date(booking.hold_expires_at)
    : null;
  return !!expires && !Number.isNaN(expires.getTime()) && expires > now;
}

export async function loadPlatformFeePercent(db: any) {
  const { data: settings } = await db
    .from("platform_settings")
    .select("platform_fee_percent")
    .eq("id", 1)
    .maybeSingle();
  const envPlatformFee = Number(
    process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT ??
      process.env.PLATFORM_FEE_PERCENT ??
      "10",
  );
  return Number(
    settings?.platform_fee_percent ??
      (Number.isFinite(envPlatformFee) ? envPlatformFee : 10),
  );
}

/**
 * The exact total the initiate / finalize / webhook paths compute, so the
 * amount shown on the resume screen is the amount Paystack will charge.
 */
export function computeCheckoutPricing(params: {
  car: any;
  booking: any;
  platformFeePercent: number;
}): CheckoutPricing {
  const { car, booking, platformFeePercent } = params;
  const nights = Math.max(
    differenceInCalendarDays(
      new Date(booking.end_date),
      new Date(booking.start_date),
    ),
    1,
  );
  const dailyRate = Number(car.daily_price ?? 0);
  const subtotal = dailyRate * nights;
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
  return {
    nights,
    dailyRate,
    subtotal,
    platformFee,
    platformFeePercent,
    insuranceFee,
    deliveryFee,
    outsideAccraSurcharge,
    depositAmount,
    total,
    amountMinor: Math.round(total * 100),
    currency: "GHS",
  };
}

/** Everything about the car or the dates that would stop this checkout today. */
export async function evaluateCheckoutConditions(params: {
  db: any;
  userId: string;
  booking: any;
  car: any | null;
}): Promise<CheckoutIssue[]> {
  const { db, userId, booking, car } = params;
  const issues: CheckoutIssue[] = [];

  if (!car) {
    return [
      {
        code: "car_not_found",
        message: "This listing is no longer on Hayame.",
      },
    ];
  }
  if (car.is_available === false) {
    issues.push({
      code: "car_unavailable",
      message: "The host has paused this car, so it can't be booked right now.",
    });
  }
  if (
    car.approval_status === "pending" ||
    car.approval_status === "rejected"
  ) {
    issues.push({
      code: "listing_not_approved",
      message: "This listing is not available for booking.",
    });
  }
  if (car.owner_id === userId) {
    issues.push({
      code: "own_car",
      message: "You cannot book your own car.",
    });
  }
  if (
    String(booking.delivery_address ?? "").trim() &&
    car.delivery_available === false
  ) {
    issues.push({
      code: "delivery_unavailable",
      message: "This car no longer offers delivery. Switch to pickup to continue.",
    });
  }

  const startDate = String(booking.start_date ?? "");
  const endDate = String(booking.end_date ?? "");
  if (!startDate || !endDate || endDate <= startDate) {
    issues.push({
      code: "dates_invalid",
      message: "Choose an end date after your start date.",
    });
  } else if (startDate < todayDateString()) {
    issues.push({
      code: "dates_past",
      message: "Your start date has already passed. Pick new dates to continue.",
    });
  } else {
    const now = new Date();
    const { data: bookingRows } = await db
      .from("bookings")
      .select("id,status,hold_expires_at")
      .eq("car_id", booking.car_id)
      .in("status", BLOCKING_STATUSES)
      .lt("start_date", endDate)
      .gt("end_date", startDate)
      .neq("id", booking.id);
    const blocking = (bookingRows ?? []).filter(
      (row: any) =>
        row.status !== "pending" ||
        !row.hold_expires_at ||
        new Date(row.hold_expires_at) > now,
    );
    if (blocking.length > 0) {
      issues.push({
        code: "dates_taken",
        message: "Someone else booked these dates. Pick new dates to continue.",
      });
    } else {
      const { data: blocked } = await db
        .from("car_availability")
        .select("id")
        .eq("car_id", booking.car_id)
        .eq("available", false)
        .lt("start_date", endDate)
        .gt("end_date", startDate);
      if (blocked && blocked.length > 0) {
        issues.push({
          code: "dates_blocked",
          message: "The host blocked these dates. Pick new dates to continue.",
        });
      }
    }
  }

  return issues;
}

export async function loadCheckoutCar(db: any, carId: string) {
  const { data } = await db
    .from("cars")
    .select(CAR_CHECKOUT_SELECT)
    .eq("id", carId)
    .maybeSingle();
  return data ?? null;
}

/** Most recent unpaid checkout this renter started in the last few days. */
export async function findResumableCheckout(db: any, userId: string) {
  const windowStart = new Date(
    Date.now() - RESUMABLE_WINDOW_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const { data: rows } = await db
    .from("bookings")
    .select(BOOKING_CHECKOUT_SELECT)
    .eq("renter_id", userId)
    .in("status", ["pending", "cancelled"])
    .in("payment_status", ["pending", "failed"])
    .gte("created_at", windowStart)
    .order("created_at", { ascending: false })
    .limit(8);
  const candidates = (rows ?? []).filter((row: any) => {
    if (isAbandonedCheckout(row)) return false;
    const reason = String(row.rejection_reason ?? "").trim();
    // Rows cancelled for other reasons (host decisions, overlap cleanup) are
    // not something the renter can pick back up.
    if (reason && reason !== "") return false;
    if (row.status === "pending") return true;
    return String(row.payment_status ?? "") === "failed";
  });
  return candidates[0] ?? null;
}

/** Cancel this renter's holds whose 15 minutes ran out (same as other routes). */
export async function expireRenterHolds(admin: any | null, userId: string) {
  if (!admin) return;
  await admin
    .from("bookings")
    .update({
      status: "cancelled",
      payment_status: "failed",
      hold_expires_at: null,
    })
    .eq("renter_id", userId)
    .eq("status", "pending")
    .lt("hold_expires_at", new Date().toISOString());
}

export function serializePendingCheckout(params: {
  booking: any;
  car: any | null;
  pricing: CheckoutPricing;
  issues: CheckoutIssue[];
}): PendingCheckoutDTO {
  const { booking, car, pricing, issues } = params;
  const deliveryAddress = String(booking.delivery_address ?? "").trim();
  const photos: string[] = Array.isArray(car?.car_photos)
    ? car.car_photos
        .map((photo: any) => String(photo?.url ?? "").trim())
        .filter(Boolean)
    : [];
  const imageUrl = photos[0] ?? (car?.image_url ? String(car.image_url) : null);
  const hostName = String(car?.owner?.full_name ?? "").trim() || "Host";
  return {
    bookingId: booking.id,
    carId: booking.car_id,
    state: isHoldActive(booking) ? "held" : "expired",
    holdExpiresAt: isHoldActive(booking) ? booking.hold_expires_at : null,
    createdAt: booking.created_at ?? null,
    startDate: booking.start_date,
    endDate: booking.end_date,
    nights: pricing.nights,
    tripMode: deliveryAddress ? "delivery" : "pickup",
    tripUseRegion: String(booking.trip_use_region ?? ""),
    tripUseCity: String(booking.trip_use_city ?? ""),
    tripUseAddress: String(booking.trip_use_address ?? ""),
    deliveryAddress: deliveryAddress || null,
    deliveryTime: deliveryAddress
      ? String(booking.delivery_time ?? "").trim() || null
      : null,
    contactPhone: deliveryAddress
      ? String(booking.contact_phone ?? "").trim() || null
      : null,
    deliveryNotes: deliveryAddress
      ? String(booking.delivery_notes ?? "").trim() || null
      : null,
    car: {
      id: String(car?.id ?? booking.car_id),
      title: String(car?.title ?? "").trim() || "Hayame listing",
      imageUrl,
      dailyPrice: Number(car?.daily_price ?? 0),
      city: car?.city ?? null,
      region: car?.region ?? null,
      instantBook: Boolean(car?.instant_book),
      deliveryAvailable: Boolean(car?.delivery_available),
      hostName,
    },
    pricing,
    issues,
    canResume: issues.length === 0,
    paymentReference: booking.payment_reference ?? null,
    paymentStatus: String(booking.payment_status ?? "pending"),
  };
}

export async function buildPendingCheckout(params: {
  db: any;
  userId: string;
  booking: any;
  car?: any | null;
}) {
  const car =
    params.car === undefined
      ? await loadCheckoutCar(params.db, params.booking.car_id)
      : params.car;
  const platformFeePercent = await loadPlatformFeePercent(params.db);
  const pricing = computeCheckoutPricing({
    car: car ?? {},
    booking: params.booking,
    platformFeePercent,
  });
  const issues = await evaluateCheckoutConditions({
    db: params.db,
    userId: params.userId,
    booking: params.booking,
    car,
  });
  return {
    car,
    pricing,
    dto: serializePendingCheckout({
      booking: params.booking,
      car,
      pricing,
      issues,
    }),
  };
}

export type ReconcileResult =
  | { outcome: "not_paid" }
  | { outcome: "completed"; booking: any; conversationId: string | null };

/**
 * The renter may have paid and never made it back to the app (killed app,
 * dropped deep link). If Paystack shows the held reference as successful,
 * run the normal finalize path so the booking is confirmed instead of asking
 * them to pay again. Safe to call repeatedly: finalize is idempotent.
 */
export async function reconcilePendingPayment(
  req: Request,
  booking: any,
  amountMinor: number,
): Promise<ReconcileResult> {
  const reference = String(booking?.payment_reference ?? "").trim();
  if (
    !reference ||
    String(booking?.status ?? "") !== "pending" ||
    String(booking?.payment_status ?? "pending") !== "pending"
  ) {
    return { outcome: "not_paid" };
  }
  try {
    await verifyPaystackTransaction(reference);
  } catch {
    return { outcome: "not_paid" };
  }

  const headers = new Headers({ "content-type": "application/json" });
  const authorization = req.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const inner = new Request(new URL("/api/bookings/paystack", req.url), {
    method: "POST",
    headers,
    body: JSON.stringify({
      bookingId: booking.id,
      reference,
      amount: Math.max(amountMinor, 1),
    }),
  });
  const response = await finalizePaystackBooking(inner);
  const payload = (await response.json().catch(() => null)) as any;
  const finalized = payload?.data;
  if (
    response.ok &&
    finalized &&
    (String(finalized.payment_status ?? "") === "paid" ||
      ["confirmed", "awaiting_host"].includes(String(finalized.status ?? "")))
  ) {
    return {
      outcome: "completed",
      booking: finalized,
      conversationId: payload?.conversationId ?? null,
    };
  }
  return { outcome: "not_paid" };
}

export function freshHoldExpiry(now = new Date()) {
  return addMinutes(now, HOLD_MINUTES).toISOString();
}
