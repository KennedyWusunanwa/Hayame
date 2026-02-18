import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      carId?: string;
      sessionKey?: string;
    };
    if (!body.carId) {
      return NextResponse.json({ message: "Missing carId" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      car_id: body.carId,
      viewer_id: user?.id ?? null,
      session_key: body.sessionKey ?? null,
    };

    const { error } = await supa.from("listing_views").insert(payload);
    if (error) {
      const text = String(error.message ?? "").toLowerCase();
      if (text.includes("duplicate key")) {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to save listing view" }, { status: 400 });
  }
}
