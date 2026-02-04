import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { hostId?: string; carId?: string | null };
    const hostId = body.hostId;
    const carId = body.carId ?? null;
    if (!hostId) return NextResponse.json({ message: "Missing hostId" }, { status: 400 });
    if (hostId === user.id) {
      return NextResponse.json({ message: "Cannot message yourself" }, { status: 400 });
    }

    const supa = supabase as any;
    let existingQuery = supa
      .from("conversations")
      .select("id")
      .eq("host_id", hostId)
      .eq("user_id", user.id);
    if (carId) {
      existingQuery = existingQuery.eq("car_id", carId);
    } else {
      existingQuery = existingQuery.is("car_id", null);
    }
    const { data: existing } = await existingQuery.maybeSingle();
    const existingRow = existing as { id?: string } | null;

    if (existingRow?.id) {
      return NextResponse.json({ id: existingRow.id });
    }

    const { data, error } = await supa
      .from("conversations")
      .insert({
        host_id: hostId,
        user_id: user.id,
        car_id: carId,
      })
      .select("id")
      .single();
    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to create conversation" }, { status: 400 });
  }
}
