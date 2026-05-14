import { NextResponse } from "next/server";
import { differenceInCalendarDays } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { initializePaystackTransaction } from "@/lib/paystack";
import { isLocationOutsideAccra, isOutsideListingRegion } from "@/lib/utils";

type Body = {
  bookingId?: string;
  callbackUrl?: string;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.EMAIL_BASE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

function sanitizeCallbackUrl(raw?: string) {
  const fallback = `${SITE_URL}/messages?paystack=1`;
  const trimmed = raw?.trim();
  if (!trimmed) return fallback;
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === "https:" || protocol === "http:") {
      return parsed.toString();
    }
    if (
      protocol === "hayameios:" ||
      protocol === "hayameandroid:" ||
      protocol === "hayame:"
    ) {
      const targetScheme = protocol.replace(":", "");
      const targetPath = `${parsed.hostname}${parsed.pathname}`.replace(
        /^\/+/,
        "",
      );
      const bridge = new URL("/api/mobile/bookings/paystack/callback", SITE_URL);
      bridge.searchParams.set("target", targetScheme);
      if (targetPath) bridge.searchParams.set("path", targetPath);
      return bridge.toString();
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (!body.bookingId) {
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

    const { data: booking, error: bookingError } = await db
      .from("bookings")
      .select(
        "id,car_id,renter_id,start_date,end_date,status,hold_expires_at,trip_use_region,trip_use_city,trip_use_address,trip_outside_accra,trip_outside_listing_region,outside_accra_surcharge",
      )
      .eq("id", body.bookingId)
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
      return NextResponse.json(
        { message: "Booking hold is no longer valid" },
        { status: 400 },
      );
    }
    if (
      booking.hold_expires_at &&
      new Date(booking.hold_expires_at) <= new Date()
    ) {
      await db
        .from("bookings")
        .update({
          status: "cancelled",
          payment_status: "failed",
          hold_expires_at: null,
        })
        .eq("id", booking.id);
      return NextResponse.json(
        { message: "Booking hold expired" },
        { status: 409 },
      );
    }

    const { data: car, error: carError } = await db
      .from("cars")
      .select(
        "id,title,daily_price,is_available,region,outside_accra_fee,delivery_fee,insurance_fee,deposit_amount",
      )
      .eq("id", booking.car_id)
      .single();

    if (carError || !car) {
      return NextResponse.json({ message: "Car not found" }, { status: 404 });
    }
    if (car.is_available === false) {
      return NextResponse.json(
        { message: "Car is unavailable" },
        { status: 409 },
      );
    }

    const tripUseRegion = (booking.trip_use_region ?? "").trim();
    const tripUseCity = (booking.trip_use_city ?? "").trim();
    const tripUseAddress = (booking.trip_use_address ?? "").trim();
    if (!tripUseRegion || !tripUseCity || tripUseAddress.length < 3) {
      return NextResponse.json(
        {
          message:
            "Trip use location is required (region, city and exact area).",
        },
        { status: 400 },
      );
    }

    const tripOutsideAccra =
      typeof booking.trip_outside_accra === "boolean"
        ? booking.trip_outside_accra
        : isLocationOutsideAccra({ region: tripUseRegion, city: tripUseCity });
    const tripOutsideListingRegion =
      typeof booking.trip_outside_listing_region === "boolean"
        ? booking.trip_outside_listing_region
        : isOutsideListingRegion({
            tripRegion: tripUseRegion,
            listingRegion: car.region ?? null,
          });

    const nights = Math.max(
      differenceInCalendarDays(
        new Date(booking.end_date),
        new Date(booking.start_date),
      ),
      1,
    );
    const subtotal = Number(car.daily_price ?? 0) * nights;

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
    const platformFeePercent = Number(
      settings?.platform_fee_percent ??
        (Number.isFinite(envPlatformFee) ? envPlatformFee : 10),
    );
    const platformFee = subtotal * (Math.max(platformFeePercent, 0) / 100);
    const insuranceFee = Math.max(Number(car.insurance_fee ?? 0), 0);
    const deliveryFee = Math.max(Number(car.delivery_fee ?? 0), 0);
    const depositAmount = Math.max(Number(car.deposit_amount ?? 0), 0);
    const heldOutsideAccraSurcharge = Number(booking.outside_accra_surcharge);
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
    const amountMinor = Math.round(total * 100);
    const reference = `hym-${booking.id.slice(0, 8)}-${Date.now()}`;
    const email = user.email ?? `${user.id}@guest.local`;
    const callbackUrl = sanitizeCallbackUrl(body.callbackUrl);

    const initialized = await initializePaystackTransaction({
      email,
      amount: amountMinor,
      reference,
      callback_url: callbackUrl,
      currency: "GHS",
      metadata: {
        bookingId: booking.id,
        carId: booking.car_id,
        renterId: user.id,
        tripOutsideAccra,
        tripOutsideListingRegion,
      },
    });

    return NextResponse.json({
      data: {
        bookingId: booking.id,
        reference,
        amount: amountMinor,
        authorization_url: initialized.authorization_url,
        payment_url: initialized.authorization_url,
        access_code: initialized.access_code ?? null,
        callback_url: callbackUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Failed to initialize payment" },
      { status: 400 },
    );
  }
}
