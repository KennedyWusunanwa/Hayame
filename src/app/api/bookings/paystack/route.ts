import { NextResponse } from "next/server";
import { differenceInCalendarDays } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyPaystackTransaction } from "@/lib/paystack";

type Body = {
  carId?: string;
  startDate?: string;
  endDate?: string;
  reference?: string;
  amount?: number;
};

const BLOCKING_STATUSES = ["pending", "awaiting_host", "confirmed", "completed"];

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

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
    const { carId, startDate, endDate, reference, amount } = body;
    if (!carId || !startDate || !endDate || !reference || !amount) {
      return NextResponse.json({ message: "Missing booking or payment details" }, { status: 400 });
    }

    const { data: carData, error: carError } = await supa
      .from("cars")
      .select("id,daily_price,owner_id")
      .eq("id", carId)
      .single();
    const car = carData as any;
    if (carError || !car) throw carError ?? new Error("Car not found");

    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json({ message: "End date must be after start date" }, { status: 400 });
    }

    const { data: conflicts } = await supa
      .from("bookings")
      .select("id,status")
      .eq("car_id", carId)
      .in("status", BLOCKING_STATUSES)
      .lte("start_date", endDate)
      .gte("end_date", startDate);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ message: "Dates not available" }, { status: 409 });
    }

    const nights = Math.max(
      differenceInCalendarDays(new Date(endDate), new Date(startDate)),
      1,
    );
    const total = Number(car.daily_price ?? 0) * nights;
    const expectedAmount = Math.round(total * 100);

    const tx = await verifyPaystackTransaction(reference);
    if (tx.amount !== expectedAmount) {
      return NextResponse.json(
        { message: "Payment amount mismatch. Please contact support." },
        { status: 400 },
      );
    }
    if (tx.status !== "success") {
      return NextResponse.json({ message: "Payment not successful" }, { status: 400 });
    }

    // Avoid duplicate inserts on refresh
    const { data: existing } = await supa
      .from("bookings")
      .select("id,status")
      .eq("payment_reference", reference)
      .maybeSingle();
    if (existing?.id) {
      return NextResponse.json({ data: existing });
    }

    const { data, error } = await supa
      .from("bookings")
      .insert({
        car_id: carId,
        renter_id: user.id,
        start_date: startDate,
        end_date: endDate,
        status: "awaiting_host",
        total_price: total,
        payment_status: "paid",
        payment_reference: reference,
        payment_provider: "paystack",
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to create booking" }, { status: 400 });
  }
}
