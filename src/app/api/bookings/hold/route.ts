import { NextResponse } from "next/server";
import { addMinutes, isAfter, parseISO } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { bookingSchema } from "@/lib/validators";
import { isLocationOutsideAccra, isOutsideListingRegion } from "@/lib/utils";
import { failJson } from "@/lib/api-errors";

const BLOCKING_STATUSES = ["pending", "awaiting_host", "confirmed"];
const HOLD_MINUTES = 15;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = bookingSchema.parse(body);
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

    const start = parseISO(parsed.startDate);
    const end = parseISO(parsed.endDate);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      !isAfter(end, start)
    ) {
      return NextResponse.json(
        { message: "End date must be after start date" },
        { status: 400 },
      );
    }

    const tripUseRegion = parsed.tripUseRegion.trim();
    const tripUseCity = parsed.tripUseCity.trim();
    const tripUseAddress = parsed.tripUseAddress.trim();
    const deliveryAddress =
      parsed.tripMode === "delivery" ? (parsed.deliveryAddress ?? "").trim() : "";
    const deliveryTime =
      parsed.tripMode === "delivery" ? (parsed.deliveryTime ?? "").trim() : "";
    const contactPhone =
      parsed.tripMode === "delivery" ? (parsed.contactPhone ?? "").trim() : "";
    const deliveryNotes =
      parsed.tripMode === "delivery" ? (parsed.deliveryNotes ?? "").trim() : "";

    const { data: car, error: carError } = await db
      .from("cars")
      .select(
        "id,owner_id,is_available,approval_status,city,region,outside_accra_fee,delivery_available",
      )
      .eq("id", parsed.carId)
      .maybeSingle();
    if (carError || !car) {
      return NextResponse.json({ message: "Car not found" }, { status: 404 });
    }
    if (car.is_available === false) {
      return NextResponse.json(
        { message: "Car is unavailable" },
        { status: 409 },
      );
    }
    if ((car as any).owner_id === user.id) {
      return NextResponse.json(
        { message: "You cannot book your own car." },
        { status: 403 },
      );
    }
    if (
      (car as any).approval_status === "pending" ||
      (car as any).approval_status === "rejected"
    ) {
      return NextResponse.json(
        { message: "This listing is not available for booking." },
        { status: 409 },
      );
    }
    if (parsed.tripMode === "delivery" && !(car as any).delivery_available) {
      return NextResponse.json(
        { message: "Delivery is not available for this car" },
        { status: 400 },
      );
    }
    if (parsed.tripMode === "delivery" && deliveryAddress.length < 3) {
      return NextResponse.json(
        { message: "Delivery address is required" },
        { status: 400 },
      );
    }

    const tripOutsideAccra = isLocationOutsideAccra({
      region: tripUseRegion,
      city: tripUseCity,
    });
    const tripOutsideListingRegion = isOutsideListingRegion({
      tripRegion: tripUseRegion,
      listingRegion: (car as any).region ?? null,
    });
    const outsideAccraSurcharge = tripOutsideListingRegion
      ? Math.max(Number((car as any).outside_accra_fee ?? 0), 0)
      : 0;

    const conflictClient = db;
    const now = new Date();
    const nowIso = now.toISOString();

    if (admin) {
      await admin
        .from("bookings")
        .update({
          status: "cancelled",
          payment_status: "failed",
          hold_expires_at: null,
        })
        .eq("status", "pending")
        .eq("car_id", parsed.carId)
        .lt("hold_expires_at", nowIso);
    }

    const { data: existingHold } = await db
      .from("bookings")
      .select(
        "id,hold_expires_at,trip_use_region,trip_use_city,trip_use_address,delivery_address,delivery_time,contact_phone,delivery_notes,trip_outside_accra,trip_outside_listing_region,outside_accra_surcharge",
      )
      .eq("car_id", parsed.carId)
      .eq("renter_id", user.id)
      .eq("status", "pending")
      .eq("start_date", parsed.startDate)
      .eq("end_date", parsed.endDate)
      .gt("hold_expires_at", nowIso)
      .maybeSingle();
    if (existingHold?.id && existingHold.hold_expires_at) {
      const needsUpdate =
        existingHold.trip_use_region !== tripUseRegion ||
        existingHold.trip_use_city !== tripUseCity ||
        existingHold.trip_use_address !== tripUseAddress ||
        (existingHold.delivery_address ?? "") !== deliveryAddress ||
        (existingHold.delivery_time ?? "") !== deliveryTime ||
        (existingHold.contact_phone ?? "") !== contactPhone ||
        (existingHold.delivery_notes ?? "") !== deliveryNotes ||
        Boolean(existingHold.trip_outside_accra) !== tripOutsideAccra ||
        Boolean(existingHold.trip_outside_listing_region) !==
          tripOutsideListingRegion ||
        Number(existingHold.outside_accra_surcharge ?? 0) !==
          outsideAccraSurcharge;

      if (needsUpdate) {
        await db
          .from("bookings")
          .update({
            trip_use_region: tripUseRegion,
            trip_use_city: tripUseCity,
            trip_use_address: tripUseAddress,
            delivery_address: deliveryAddress || null,
            delivery_time: deliveryTime || null,
            contact_phone: contactPhone || null,
            delivery_notes: deliveryNotes || null,
            trip_outside_accra: tripOutsideAccra,
            trip_outside_listing_region: tripOutsideListingRegion,
            outside_accra_surcharge: outsideAccraSurcharge,
          })
          .eq("id", existingHold.id);
      }
      return NextResponse.json({
        bookingId: existingHold.id,
        hold_expires_at: existingHold.hold_expires_at,
      });
    }

    const { data: bookingRows } = await conflictClient
      .from("bookings")
      .select("id,status,start_date,end_date,hold_expires_at")
      .eq("car_id", parsed.carId)
      .in("status", BLOCKING_STATUSES)
      .lt("start_date", parsed.endDate)
      .gt("end_date", parsed.startDate);

    const blocking = (bookingRows ?? []).filter(
      (row: any) =>
        row.status !== "pending" ||
        !row.hold_expires_at ||
        new Date(row.hold_expires_at) > now,
    );
    if (blocking.length > 0) {
      return NextResponse.json(
        { message: "Dates not available" },
        { status: 409 },
      );
    }

    const { data: blocked } = await conflictClient
      .from("car_availability")
      .select("id")
      .eq("car_id", parsed.carId)
      .eq("available", false)
      .lt("start_date", parsed.endDate)
      .gt("end_date", parsed.startDate);
    if (blocked && blocked.length > 0) {
      return NextResponse.json(
        { message: "Dates not available" },
        { status: 409 },
      );
    }

    const holdExpiresAt = addMinutes(now, HOLD_MINUTES).toISOString();
    const { data: hold, error } = await db
      .from("bookings")
      .insert({
        car_id: parsed.carId,
        renter_id: user.id,
        start_date: parsed.startDate,
        end_date: parsed.endDate,
        status: "pending",
        payment_status: "pending",
        hold_expires_at: holdExpiresAt,
        trip_use_region: tripUseRegion,
        trip_use_city: tripUseCity,
        trip_use_address: tripUseAddress,
        delivery_address: deliveryAddress || null,
        delivery_time: deliveryTime || null,
        contact_phone: contactPhone || null,
        delivery_notes: deliveryNotes || null,
        trip_outside_accra: tripOutsideAccra,
        trip_outside_listing_region: tripOutsideListingRegion,
        outside_accra_surcharge: outsideAccraSurcharge,
      })
      .select("id,hold_expires_at")
      .single();
    if (error) throw error;

    return NextResponse.json({
      bookingId: hold.id,
      hold_expires_at: hold.hold_expires_at,
    });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/bookings/hold",
      status: 400,
      userMessage: "We couldn't hold this car for you. Please try again.",
    });
  }
}
