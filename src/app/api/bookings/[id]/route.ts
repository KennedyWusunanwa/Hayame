import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { refundPaystack } from "@/lib/paystack";

type Params = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: Params) {
  try {
    const resolvedParams = await params;
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = resolvedParams;
    const payload = (await req.json().catch(() => ({}))) as { action?: string; reason?: string };
    const action = payload?.action;
    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supa
      .from("bookings")
      .select("*, cars:cars!inner(owner_id)")
      .eq("id", id)
      .single();
    if (bookingError || !booking) throw bookingError ?? new Error("Booking not found");

    const ownerId = (booking as any)?.cars?.owner_id;
    if (ownerId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (booking.status !== "awaiting_host") {
      return NextResponse.json({ message: "Only pending approvals can be modified" }, { status: 400 });
    }

    if (action === "approve") {
      const { data, error } = await supa
        .from("bookings")
        .update({ status: "confirmed", approved_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    // reject path
    if (booking.payment_provider === "paystack" && booking.payment_reference) {
      await refundPaystack(booking.payment_reference);
    }

    const { data, error } = await supa
      .from("bookings")
      .update({
        status: "rejected",
        payment_status: "refunded",
        rejected_at: new Date().toISOString(),
        rejection_reason: payload?.reason ?? "Rejected by host",
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to update booking" }, { status: 400 });
  }
}
