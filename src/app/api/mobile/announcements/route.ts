import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchActiveAnnouncements } from "@/lib/notifications";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { failJson } from "@/lib/api-errors";

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();

    if (!admin) {
      return NextResponse.json({ data: [] });
    }

    const data = await fetchActiveAnnouncements({
      admin,
      userId: user?.id ?? null,
      includePushOnly: false,
      limit: 8,
    });
    return NextResponse.json({ data });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/mobile/announcements",
      status: 400,
      userMessage: "Couldn't load announcements. Please try again.",
    });
  }
}
