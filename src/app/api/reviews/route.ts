import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { reviewSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const { searchParams } = new URL(req.url);
    const scope = (searchParams.get("scope") ?? "host").toLowerCase();
    const carId = (searchParams.get("carId") ?? "").trim();

    if (scope === "public" || carId) {
      if (!carId) {
        return NextResponse.json({ data: [] });
      }

      const { data, error } = await supa
        .from("reviews")
        .select(
          "id,car_id,booking_id,user_id,rating,comment,created_at,cars(title),reviewer:profiles!reviews_user_id_fkey(full_name,avatar_url)",
        )
        .eq("car_id", carId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return NextResponse.json({ data: data ?? [] });
    }

    const user = await getRequestUser(supabase as any, req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    if (scope === "mine") {
      const { data, error } = await supa
        .from("reviews")
        .select("id,car_id,booking_id,user_id,rating,comment,created_at,cars(title)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ data: data ?? [] });
    }

    const { data: ownedCars } = await supa.from("cars").select("id").eq("owner_id", user.id);
    const carIds = (ownedCars ?? []).map((row: any) => row.id).filter(Boolean);
    if (carIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supa
      .from("reviews")
      .select(
        "id,car_id,booking_id,user_id,rating,comment,created_at,cars(title),reviewer:profiles!reviews_user_id_fkey(full_name,avatar_url)",
      )
      .in("car_id", carIds)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to load reviews" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const body = await req.json();
    const parsed = reviewSchema.parse(body);

    const user = await getRequestUser(supabase as any, req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data: booking, error: bookingError } = await supa
      .from("bookings")
      .select("renter_id,status,car_id")
      .eq("id", parsed.bookingId)
      .single();
    if (bookingError || !booking) throw bookingError ?? new Error("Booking not found");

    if (booking.renter_id !== user.id || booking.status !== "completed") {
      return NextResponse.json({ message: "You can only review completed trips" }, { status: 403 });
    }

    const { data: existingReview } = await supa
      .from("reviews")
      .select("id")
      .eq("booking_id", parsed.bookingId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existingReview) {
      return NextResponse.json({ message: "Review already submitted for this trip" }, { status: 409 });
    }

    const { data, error } = await supa
      .from("reviews")
      .insert({
        booking_id: parsed.bookingId,
        car_id: booking.car_id,
        user_id: user.id,
        rating: parsed.rating,
        comment: parsed.comment,
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to submit review" }, { status: 400 });
  }
}
