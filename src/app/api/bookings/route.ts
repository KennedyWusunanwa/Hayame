import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";

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

    const today = new Date().toISOString().slice(0, 10);
    await db
      .from("bookings")
      .update({ status: "completed" })
      .eq("renter_id", user.id)
      .eq("status", "confirmed")
      .lt("end_date", today);

    const { data: ownedCars } = await db
      .from("cars")
      .select("id")
      .eq("owner_id", user.id);
    const ownerCarIds = (ownedCars as any)?.map((c: any) => c.id) ?? [];

    if (ownerCarIds.length > 0) {
      await db
        .from("bookings")
        .update({ status: "completed" })
        .in("car_id", ownerCarIds)
        .eq("status", "confirmed")
        .lt("end_date", today);
    }

    const bookingSelect =
      "id,car_id,renter_id,start_date,end_date,status,trip_use_region,trip_use_city,trip_use_address,delivery_address,delivery_time,contact_phone,delivery_notes,trip_outside_accra,trip_outside_listing_region,outside_accra_surcharge,nights,daily_rate,subtotal,platform_fee,insurance_fee,delivery_fee,deposit_amount,total_price,payment_status,payment_reference,payment_provider,paid_at,approved_at,rejected_at,rejection_reason,created_at,cars(id,title,city,region,owner_id,cancellation_policy,car_photos(url),owner:profiles!cars_owner_id_fkey(id,full_name,avatar_url,phone)),renter:profiles!bookings_renter_id_fkey(id,full_name,avatar_url,phone)";

    const renterBookings = await db
      .from("bookings")
      .select(bookingSelect)
      .eq("renter_id", user.id)
      .order("created_at", { ascending: false })
      .order("start_date", { ascending: false });

    const ownerBookings =
      ownerCarIds.length > 0
        ? await db
            .from("bookings")
            .select(bookingSelect)
            .in("car_id", ownerCarIds)
            .order("created_at", { ascending: false })
            .order("start_date", { ascending: false })
        : { data: [], error: null };

    if (renterBookings.error || ownerBookings.error) {
      throw renterBookings.error ?? ownerBookings.error;
    }

    const combined = [
      ...(renterBookings.data ?? []),
      ...(ownerBookings.data ?? []),
    ] as any[];
    const unique = Array.from(
      new Map(combined.map((item) => [item.id, item])).values(),
    );
    const carIds = Array.from(
      new Set(unique.map((item) => item.car_id).filter(Boolean)),
    );
    const { data: conversationRows } =
      carIds.length > 0
        ? await db
            .from("conversations")
            .select("id,host_id,user_id,car_id")
            .in("car_id", carIds)
        : { data: [] as any[] };

    const conversationByPair = new Map<string, string>();
    for (const conversation of conversationRows ?? []) {
      const key = `${conversation.host_id}|${conversation.user_id}|${conversation.car_id}`;
      conversationByPair.set(key, conversation.id);
    }

    const withRole = unique.map((item: any) => {
      const role = [];
      if (item.renter_id === user.id) role.push("renter");
      if (ownerCarIds.includes(item.car_id)) role.push("owner");
      const hostId = item?.cars?.owner_id ?? null;
      const conversationKey = hostId
        ? `${hostId}|${item.renter_id}|${item.car_id}`
        : null;
      const conversationId = conversationKey
        ? (conversationByPair.get(conversationKey) ?? null)
        : null;
      return {
        ...item,
        role: role.join("+") || "guest",
        conversation_id: conversationId,
      };
    });
    const sorted = [...withRole].sort((a: any, b: any) => {
      const createdA = Date.parse(a?.created_at ?? "");
      const createdB = Date.parse(b?.created_at ?? "");
      if (!Number.isNaN(createdA) || !Number.isNaN(createdB)) {
        const safeA = Number.isNaN(createdA) ? 0 : createdA;
        const safeB = Number.isNaN(createdB) ? 0 : createdB;
        if (safeB !== safeA) return safeB - safeA;
      }
      const startA = Date.parse(a?.start_date ?? "");
      const startB = Date.parse(b?.start_date ?? "");
      const safeStartA = Number.isNaN(startA) ? 0 : startA;
      const safeStartB = Number.isNaN(startB) ? 0 : startB;
      return safeStartB - safeStartA;
    });
    return NextResponse.json({ data: sorted });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Failed to load bookings" },
      { status: 400 },
    );
  }
}

export async function POST() {
  const message =
    "Direct booking is disabled. Use the Paystack flow to pay before host approval.";
  return NextResponse.json({ message }, { status: 400 });
}
