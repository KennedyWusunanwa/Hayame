import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { getHostStatus } from "@/lib/host-status";
import { failJson } from "@/lib/api-errors";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { isHost, status } = await getHostStatus(supabase as any, user.id);

    if (!status) {
      return NextResponse.json(
        { message: "No host application found." },
        { status: 404 },
      );
    }

    if (status !== "approved") {
      return NextResponse.json(
        { message: "Host application is not approved." },
        { status: 403 },
      );
    }
    return NextResponse.json({ is_host: isHost, status: "approved" });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/host-activate",
      status: 500,
      userMessage: "Unable to activate host access. Please try again.",
    });
  }
}
