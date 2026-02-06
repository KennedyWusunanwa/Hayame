import { NextResponse } from "next/server";
import { addMinutes, isAfter, parseISO } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { bookingSchema } from "@/lib/validators";

const BLOCKING_STATUSES = ["pending", "awaiting_host", "confirmed"];
const HOLD_MINUTES = 15;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = bookingSchema.parse(body);
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const start = parseISO(parsed.startDate);
    const end = parseISO(parsed.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || !isAfter(end, start)) {
      return NextResponse.json({ message: "End date must be after start date" }, { status: 400 });
    }

    const { data: car, error: carError } = await supa
      .from("cars")
      .select("id,is_available")
      .eq("id", parsed.carId)
      .maybeSingle();
    if (carError || !car) {
      return NextResponse.json({ message: "Car not found" }, { status: 404 });
    }
    if (car.is_available === false) {
      return NextResponse.json({ message: "Car is unavailable" }, { status: 409 });
    }

    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();
    const conflictClient = admin ?? supa;
    const now = new Date();
    const nowIso = now.toISOString();

    if (admin) {
      await admin
        .from("bookings")
        .update({ status: "cancelled", payment_status: "failed", hold_expires_at: null })
        .eq("status", "pending")
        .eq("car_id", parsed.carId)
        .lt("hold_expires_at", nowIso);
    }

    const { data: existingHold } = await supa
      .from("bookings")
      .select("id,hold_expires_at")
      .eq("car_id", parsed.carId)
      .eq("renter_id", user.id)
      .eq("status", "pending")
      .eq("start_date", parsed.startDate)
      .eq("end_date", parsed.endDate)
      .gt("hold_expires_at", nowIso)
      .maybeSingle();
    if (existingHold?.id && existingHold.hold_expires_at) {
      return NextResponse.json({ bookingId: existingHold.id, hold_expires_at: existingHold.hold_expires_at });
    }

    const { data: bookingRows } = await conflictClient
      .from("bookings")
      .select("id,status,start_date,end_date,hold_expires_at")
      .eq("car_id", parsed.carId)
      .in("status", BLOCKING_STATUSES)
      .lt("start_date", parsed.endDate)
      .gt("end_date", parsed.startDate);

    const blocking = (bookingRows ?? []).filter(
      (row: any) => row.status !== "pending" || !row.hold_expires_at || new Date(row.hold_expires_at) > now,
    );
    if (blocking.length > 0) {
      return NextResponse.json({ message: "Dates not available" }, { status: 409 });
    }

    const { data: blocked } = await conflictClient
      .from("car_availability")
      .select("id")
      .eq("car_id", parsed.carId)
      .eq("available", false)
      .lt("start_date", parsed.endDate)
      .gt("end_date", parsed.startDate);
    if (blocked && blocked.length > 0) {
      return NextResponse.json({ message: "Dates not available" }, { status: 409 });
    }

    const holdExpiresAt = addMinutes(now, HOLD_MINUTES).toISOString();
    const { data: hold, error } = await supa
      .from("bookings")
      .insert({
        car_id: parsed.carId,
        renter_id: user.id,
        start_date: parsed.startDate,
        end_date: parsed.endDate,
        status: "pending",
        payment_status: "pending",
        hold_expires_at: holdExpiresAt,
      })
      .select("id,hold_expires_at")
      .single();
    if (error) throw error;

    return NextResponse.json({ bookingId: hold.id, hold_expires_at: hold.hold_expires_at });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to create hold" }, { status: 400 });
  }
}
