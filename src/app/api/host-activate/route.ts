import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHostStatus } from "@/lib/host-status";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { isHost, status } = await getHostStatus(supabase as any, user.id);

    if (!status) {
      return NextResponse.json({ message: "No host application found." }, { status: 404 });
    }

    if (status !== "approved") {
      return NextResponse.json({ message: "Host application is not approved." }, { status: 403 });
    }
    return NextResponse.json({ is_host: isHost, status: "approved" });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Unable to activate host access." },
      { status: 500 },
    );
  }
}
