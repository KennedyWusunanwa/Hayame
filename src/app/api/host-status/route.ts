import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ is_host: false, status: null });

    let isHost = false;
    const { data: profile, error: profileError } = await supa
      .from("profiles")
      .select("is_host")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileError && profile?.is_host) {
      isHost = true;
      return NextResponse.json({ is_host: true, status: "approved" });
    }

    const { data: application } = await supa
      .from("host_applications")
      .select("status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      is_host: isHost,
      status: (application as { status?: string } | null)?.status ?? null,
      error: profileError?.message ?? null,
    });
  } catch (error: any) {
    return NextResponse.json({ is_host: false, status: null, error: error.message ?? "Failed" });
  }
}
