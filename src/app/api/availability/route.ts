import { NextResponse } from "next/server";
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

    const { data: carData } = await supabase.from("cars").select("owner_id").eq("id", parsed.carId).single();
    const car = carData as { owner_id: string } | null;
    if (!car || car.owner_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const supa = supabase as any;
    const { data: availability, error } = await supa
      .from("car_availability")
      .insert({
        car_id: parsed.carId,
        start_date: parsed.startDate,
        end_date: parsed.endDate,
        available: parsed.available ?? true,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ data: availability });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to save availability" }, { status: 400 });
  }
}
