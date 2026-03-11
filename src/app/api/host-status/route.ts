import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { getHostStatus } from "@/lib/host-status";

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!user) {
      return NextResponse.json({
        is_host: false,
        host_application_status: null,
        status: null,
      });
    }

    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();

    const statusClient = admin ?? (supabase as any);
    const { isHost, status } = await getHostStatus(statusClient, user.id);
    return NextResponse.json({
      is_host: isHost,
      host_application_status: status,
      status,
    });
  } catch (error: any) {
    return NextResponse.json({
      is_host: false,
      host_application_status: null,
      status: null,
      error: error.message ?? "Failed",
    });
  }
}
