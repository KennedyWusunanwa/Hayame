import { NextResponse } from "next/server";
import { failJson } from "@/lib/api-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { disputeSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
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

    const { data: renterBookings, error: renterError } = await db
      .from("bookings")
      .select("id")
      .eq("renter_id", user.id);
    if (renterError) throw renterError;

    const { data: ownedCars, error: ownedCarsError } = await db
      .from("cars")
      .select("id")
      .eq("owner_id", user.id);
    if (ownedCarsError) throw ownedCarsError;
    const ownerCarIds = (ownedCars ?? []).map((car: any) => car.id);

    const { data: ownerBookings, error: ownerError } =
      ownerCarIds.length > 0
        ? await db.from("bookings").select("id").in("car_id", ownerCarIds)
        : { data: [] as any[], error: null };
    if (ownerError) throw ownerError;

    const bookingIds = Array.from(
      new Set([
        ...(renterBookings ?? []).map((row: any) => row.id),
        ...(ownerBookings ?? []).map((row: any) => row.id),
      ]),
    );
    if (bookingIds.length === 0) return NextResponse.json({ data: [] });

    const { data, error } = await db
      .from("disputes")
      .select(
        "id,booking_id,car_id,reason,status,resolution_note,created_at,updated_at,cars(title)",
      )
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/disputes",
      status: 400,
      userMessage: "Couldn't load your disputes. Please try again.",
    });
  }
}

export async function POST(req: Request) {
  try {
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

    const body = await req.json();
    const parsed = disputeSchema.parse(body);

    const { data: booking, error: bookingError } = await db
      .from("bookings")
      .select("id,car_id,renter_id,cars:cars!inner(owner_id)")
      .eq("id", parsed.bookingId)
      .single();
    if (bookingError || !booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 },
      );
    }

    const isRenter = booking.renter_id === user.id;
    const isHost = booking.cars?.owner_id === user.id;
    if (!isRenter && !isHost) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { data: existingDispute } = await db
      .from("disputes")
      .select(
        "id,booking_id,car_id,reason,status,resolution_note,created_at,updated_at",
      )
      .eq("booking_id", booking.id)
      .eq("opened_by", user.id)
      .in("status", ["open", "under_review"])
      .maybeSingle();
    if (existingDispute) {
      return NextResponse.json({
        data: existingDispute,
        message: "An open dispute already exists for this booking.",
      });
    }

    const { data: created, error } = await db
      .from("disputes")
      .insert({
        booking_id: booking.id,
        car_id: booking.car_id,
        opened_by: user.id,
        reason: parsed.reason,
        status: "open",
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ data: created });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/disputes",
      status: 400,
      userMessage: "Couldn't open your dispute. Please try again.",
    });
  }
}
