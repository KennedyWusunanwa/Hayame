import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addDays, format, isAfter, parseISO } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { availabilitySchema } from "@/lib/validators";
import { getHostStatus } from "@/lib/host-status";

const BLOCKING_STATUSES = ["pending", "awaiting_host", "confirmed"];
const COOKIE_NAME = "admin_auth";

function adminToken() {
  const username = process.env.ADMIN_USERNAME ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!username || !password) return null;
  return Buffer.from(`${username}:${password}`).toString("base64");
}

async function isAdmin() {
  const token = adminToken();
  if (!token) return false;
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  return cookie === token;
}

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
    if (!startDate || !endDate || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || !isAfter(end, start)) {
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

    if (admin) {
      const nowIso = new Date().toISOString();
      await admin
        .from("bookings")
        .update({ status: "cancelled", payment_status: "failed", hold_expires_at: null })
        .eq("status", "pending")
        .lt("hold_expires_at", nowIso);
    }

    const { data: car, error: carError } = await supa
      .from("cars")
      .select("is_available")
      .eq("id", carId)
      .maybeSingle();
    if (carError || !car) {
      return NextResponse.json({ message: "Car not found" }, { status: 404 });
    }
    if (car.is_available === false) {
      const blockedDates = new Set<string>();
      addDatesToSet(blockedDates, startDate, endDate);
      const blocked = Array.from(blockedDates).sort();
      return NextResponse.json({ blockedDates: blocked, available: false, reason: "car_unavailable" });
    }

    const { data: availabilityRows } = await availabilityClient
      .from("car_availability")
      .select("start_date,end_date,available")
      .eq("car_id", carId)
      .lt("start_date", endDate)
      .gt("end_date", startDate);

    const { data: bookingRows } = await bookingsClient
      .from("bookings")
      .select("start_date,end_date,status,hold_expires_at")
      .eq("car_id", carId)
      .in("status", BLOCKING_STATUSES)
      .lt("start_date", endDate)
      .gt("end_date", startDate);

    const blockedDates = new Set<string>();
    const now = new Date();

    (availabilityRows ?? [])
      .filter((row: any) => row.available === false)
      .forEach((row: any) => {
        addDatesToSet(blockedDates, row.start_date, row.end_date);
      });

    (bookingRows ?? [])
      .filter((row: any) => row.status !== "pending" || !row.hold_expires_at || new Date(row.hold_expires_at) > now)
      .forEach((row: any) => {
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
    const start = parseISO(parsed.startDate);
    const end = parseISO(parsed.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || !isAfter(end, start)) {
      return NextResponse.json({ message: "Invalid date range" }, { status: 400 });
    }
    const admin = await isAdmin();
    const supabase = await createSupabaseServerClient();
    const supa = admin ? (createSupabaseAdminClient() as any) : (supabase as any);

    if (!admin) {
      const user = await getRequestUser(supabase as any, req);
      if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

      const { isHost } = await getHostStatus(supabase as any, user.id);
      if (!isHost) {
        return NextResponse.json({ message: "Host approval required" }, { status: 403 });
      }

      const { data: carData } = await supabase.from("cars").select("owner_id").eq("id", parsed.carId).single();
      const car = carData as { owner_id: string } | null;
      if (!car || car.owner_id !== user.id) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    }

    const repeatDays = new Set((parsed.repeatDays ?? []).map((d) => d.toLowerCase()));
    const rows: any[] = [];

    if (repeatDays.size === 0) {
      rows.push({
        car_id: parsed.carId,
        start_date: parsed.startDate,
        end_date: parsed.endDate,
        available: parsed.available ?? true,
      });
    } else {
      for (let dt = new Date(start); dt < end; dt = addDays(dt, 1)) {
        const weekday = dt.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase(); // e.g., mon, tue
        const weekdayLong = dt.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        if (repeatDays.has(weekday) || repeatDays.has(weekdayLong)) {
          const iso = dt.toISOString().slice(0, 10);
          const nextIso = addDays(dt, 1).toISOString().slice(0, 10);
          rows.push({
            car_id: parsed.carId,
            start_date: iso,
            end_date: nextIso,
            available: false,
          });
        }
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ message: "No matching dates to save." }, { status: 400 });
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
  while (cursor < end) {
    set.add(format(cursor, "yyyy-MM-dd"));
    cursor = addDays(cursor, 1);
  }
}

function rangeHasBlockedDates(startDate: string, endDate: string, blocked: Set<string>) {
  let cursor = parseISO(startDate);
  const end = parseISO(endDate);
  while (cursor < end) {
    if (blocked.has(format(cursor, "yyyy-MM-dd"))) {
      return true;
    }
    cursor = addDays(cursor, 1);
  }
  return false;
}
