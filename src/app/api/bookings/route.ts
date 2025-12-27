import { NextResponse } from "next/server";
import { differenceInCalendarDays } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bookingSchema } from "@/lib/validators";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data: ownedCars } = await supa.from("cars").select("id").eq("owner_id", user.id);
    const ownerCarIds = (ownedCars as any)?.map((c: any) => c.id) ?? [];

    const renterBookings = await supa
      .from("bookings")
      .select("*, cars(title, city, region)")
      .eq("renter_id", user.id)
      .order("start_date", { ascending: false });

    const ownerBookings =
      ownerCarIds.length > 0
        ? await supa
            .from("bookings")
            .select("*, cars(title, city, region)")
            .in("car_id", ownerCarIds)
            .order("start_date", { ascending: false })
        : { data: [], error: null };

    if (renterBookings.error || ownerBookings.error) {
      throw renterBookings.error ?? ownerBookings.error;
    }

    const combined = [...(renterBookings.data ?? []), ...(ownerBookings.data ?? [])] as any[];
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
    return NextResponse.json({ data: unique });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to load bookings" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const body = await req.json();
    const parsed = bookingSchema.parse(body);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data: carData, error: carError } = await supa
      .from("cars")
      .select("id,daily_price")
      .eq("id", parsed.carId)
      .single();
    const car = carData as any;
    if (carError || !car) throw carError ?? new Error("Car not found");

    if (new Date(parsed.endDate) <= new Date(parsed.startDate)) {
      return NextResponse.json({ message: "End date must be after start date" }, { status: 400 });
    }

    const { data: conflicts } = await supa
      .from("bookings")
      .select("id")
      .eq("car_id", parsed.carId)
      .in("status", ["pending", "confirmed"])
      .lte("start_date", parsed.endDate)
      .gte("end_date", parsed.startDate);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ message: "Dates not available" }, { status: 409 });
    }

    const nights = Math.max(
      differenceInCalendarDays(new Date(parsed.endDate), new Date(parsed.startDate)),
      1,
    );
    const total = Number(car.daily_price ?? 0) * nights;

    const { data, error } = await supa
      .from("bookings")
      .insert({
        car_id: parsed.carId,
        renter_id: user.id,
        start_date: parsed.startDate,
        end_date: parsed.endDate,
        status: "pending",
        total_price: total,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to create booking" }, { status: 400 });
  }
}
