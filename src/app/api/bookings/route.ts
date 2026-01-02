import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

    const bookingSelect = "*, cars(title, city, region, owner_id)";

    const renterBookings = await supa
      .from("bookings")
      .select(bookingSelect)
      .eq("renter_id", user.id)
      .order("start_date", { ascending: false });

    const ownerBookings =
      ownerCarIds.length > 0
        ? await supa
            .from("bookings")
            .select(bookingSelect)
            .in("car_id", ownerCarIds)
            .order("start_date", { ascending: false })
        : { data: [], error: null };

    if (renterBookings.error || ownerBookings.error) {
      throw renterBookings.error ?? ownerBookings.error;
    }

    const combined = [...(renterBookings.data ?? []), ...(ownerBookings.data ?? [])] as any[];
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
    const withRole = unique.map((item: any) => {
      const role = [];
      if (item.renter_id === user.id) role.push("renter");
      if (ownerCarIds.includes(item.car_id)) role.push("owner");
      return { ...item, role: role.join("+") || "guest" };
    });
    return NextResponse.json({ data: withRole });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to load bookings" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const message = "Direct booking is disabled. Use the Paystack flow to pay before host approval.";
  return NextResponse.json({ message }, { status: 400 });
}
