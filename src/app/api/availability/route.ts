import { NextResponse } from "next/server";
import { addDays, format, isAfter, parseISO } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { availabilitySchema } from "@/lib/validators";

const BLOCKING_STATUSES = ["pending", "awaiting_host", "confirmed"];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const carId = searchParams.get("carId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (!carId || !startDate || !endDate) {
      return NextResponse.json({ message: "Missing carId or date range" }, { status: 400 });
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (!startDate || !endDate || isAfter(start, end)) {
      return NextResponse.json({ message: "Invalid date range" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();

    const availabilityClient = admin ?? supa;
    const bookingsClient = admin ?? supa;

    const { data: availabilityRows } = await availabilityClient
      .from("car_availability")
      .select("start_date,end_date,available")
      .eq("car_id", carId)
      .lte("start_date", endDate)
      .gte("end_date", startDate);

    const { data: bookingRows } = await bookingsClient
      .from("bookings")
      .select("start_date,end_date,status")
      .eq("car_id", carId)
      .in("status", BLOCKING_STATUSES)
      .lte("start_date", endDate)
      .gte("end_date", startDate);

    const blockedDates = new Set<string>();

    (availabilityRows ?? [])
      .filter((row: any) => row.available === false)
      .forEach((row: any) => {
        addDatesToSet(blockedDates, row.start_date, row.end_date);
      });

    (bookingRows ?? []).forEach((row: any) => {
      addDatesToSet(blockedDates, row.start_date, row.end_date);
    });

    const blocked = Array.from(blockedDates).sort();
    const isAvailable = !rangeHasBlockedDates(startDate, endDate, blockedDates);

    return NextResponse.json({ blockedDates: blocked, available: isAvailable });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to load availability" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = availabilitySchema.parse(body);
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data: profileData } = await supabase
      .from("profiles")
      .select("is_host")
      .eq("id", user.id)
      .maybeSingle();
    const profile = profileData as { is_host?: boolean } | null;
    if (!profile?.is_host) {
      return NextResponse.json({ message: "Host approval required" }, { status: 403 });
    }

    const { data: carData } = await supabase.from("cars").select("owner_id").eq("id", parsed.carId).single();
    const car = carData as { owner_id: string } | null;
    if (!car || car.owner_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const supa = supabase as any;
    const repeatDays = new Set((parsed.repeatDays ?? []).map((d) => d.toLowerCase()));
    const rows: any[] = [];

    // Always push the explicit range
    rows.push({
      car_id: parsed.carId,
      start_date: parsed.startDate,
      end_date: parsed.endDate,
      available: parsed.available ?? true,
    });

    // If recurring weekdays specified, generate blocks from start to end
    if (repeatDays.size > 0) {
      const start = new Date(parsed.startDate);
      const end = new Date(parsed.endDate);
      for (let dt = new Date(start); dt <= end; dt = addDays(dt, 1)) {
        const weekday = dt.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase(); // e.g., mon, tue
        const weekdayLong = dt.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        if (repeatDays.has(weekday) || repeatDays.has(weekdayLong)) {
          const iso = dt.toISOString().slice(0, 10);
          rows.push({
            car_id: parsed.carId,
            start_date: iso,
            end_date: iso,
            available: parsed.available ?? false,
          });
        }
      }
    }

    const { data: availability, error } = await supa.from("car_availability").insert(rows).select();
    if (error) throw error;
    return NextResponse.json({ data: availability });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to save availability" }, { status: 400 });
  }
}

function addDatesToSet(set: Set<string>, startDate: string, endDate: string) {
  let cursor = parseISO(startDate);
  const end = parseISO(endDate);
  while (!isAfter(cursor, end)) {
    set.add(format(cursor, "yyyy-MM-dd"));
    cursor = addDays(cursor, 1);
  }
}

function rangeHasBlockedDates(startDate: string, endDate: string, blocked: Set<string>) {
  let cursor = parseISO(startDate);
  const end = parseISO(endDate);
  while (!isAfter(cursor, end)) {
    if (blocked.has(format(cursor, "yyyy-MM-dd"))) {
      return true;
    }
    cursor = addDays(cursor, 1);
  }
  return false;
}
