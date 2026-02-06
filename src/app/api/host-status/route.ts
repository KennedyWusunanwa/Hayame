import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHostStatus } from "@/lib/host-status";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ is_host: false, status: null });

    const { isHost, status } = await getHostStatus(supabase as any, user.id);
    return NextResponse.json({ is_host: isHost, status });
  } catch (error: any) {
    return NextResponse.json({ is_host: false, status: null, error: error.message ?? "Failed" });
  }
}
