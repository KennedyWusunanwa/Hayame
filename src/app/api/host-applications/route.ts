import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hostApplicationSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data } = await supa
      .from("host_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ data: data ?? null });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to load application" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = hostApplicationSchema.parse(body);
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data: latest } = await supa
      .from("host_applications")
      .select("id,status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest?.status === "approved") {
      return NextResponse.json({ message: "You are already an approved host." }, { status: 400 });
    }
    if (latest?.status === "pending") {
      return NextResponse.json({ message: "Application already pending." }, { status: 409 });
    }

    await supa
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: parsed.full_name,
          phone: parsed.phone ?? null,
          city: parsed.city ?? null,
        },
        { onConflict: "id" },
      );

    const { data, error } = await supa
      .from("host_applications")
      .insert({
        user_id: user.id,
        full_name: parsed.full_name,
        phone: parsed.phone ?? null,
        region: parsed.region ?? null,
        city: parsed.city ?? null,
        id_type: parsed.id_type ?? null,
        id_number: parsed.id_number ?? null,
        id_front_path: parsed.id_front_path ?? null,
        id_back_path: parsed.id_back_path ?? null,
        note: parsed.note ?? null,
        experience: parsed.experience,
        fleet_size: parsed.fleet_size ?? null,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "Invalid application data", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ message: error.message ?? "Failed to submit application" }, { status: 400 });
  }
}
