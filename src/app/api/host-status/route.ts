import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { getHostStatus } from "@/lib/host-status";
import { logServerError } from "@/lib/api-errors";

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
  } catch (error) {
    // Graceful degradation: keep the 200 contract the clients expect, but log
    // the technical detail server-side and return a friendly error string
    // instead of the raw message.
    await logServerError({
      error,
      req,
      route: "/api/host-status",
      status: 200,
    });
    return NextResponse.json({
      is_host: false,
      host_application_status: null,
      status: null,
      error: "Couldn't load host status.",
    });
  }
}
