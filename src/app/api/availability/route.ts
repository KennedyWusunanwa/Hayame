import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { availabilitySchema } from "@/lib/validators";

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
