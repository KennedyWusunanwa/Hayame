import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { markAnnouncementSeen } from "@/lib/notifications";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { failJson } from "@/lib/api-errors";

type Context = {
  params: Promise<{ id: string }> | { id: string };
};

export async function POST(req: Request, context: Context) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const announcementId = String(resolvedParams.id ?? "").trim();
    if (!announcementId) {
      return NextResponse.json(
        { message: "Announcement id is required." },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient() as any;
    await markAnnouncementSeen({
      admin,
      userId: user.id,
      announcementId,
    });

    return NextResponse.json({ seen: true });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/mobile/announcements/[id]/seen",
      status: 400,
      userMessage: "Couldn't mark the announcement as seen. Please try again.",
    });
  }
}
