import { NextResponse } from "next/server";
import { failJson } from "@/lib/api-errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getUserNotificationPreferences,
  isMissingNotificationStorageError,
  parseNotificationPreferences,
} from "@/lib/notifications";
import { getRequestUser } from "@/lib/supabase/request-auth";

type Body = {
  booking_updates?: boolean;
  messages?: boolean;
  account_security?: boolean;
  news_announcements?: boolean;
};

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient() as any;
    const data = await getUserNotificationPreferences({
      admin,
      userId: user.id,
    });
    return NextResponse.json({ data });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/mobile/notifications/preferences",
      status: 400,
      userMessage: "Couldn't load your notification preferences. Please try again.",
    });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient() as any;
    const payload = (await req.json().catch(() => ({}))) as Body;
    const data = parseNotificationPreferences(payload);

    const { error } = await admin.from("user_notification_preferences").upsert(
      {
        user_id: user.id,
        ...data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      if (isMissingNotificationStorageError(error)) {
        return NextResponse.json({
          data: {
            ...DEFAULT_NOTIFICATION_PREFERENCES,
            ...data,
          },
          persisted: false,
        });
      }
      return failJson({
        error,
        req,
        route: "/api/mobile/notifications/preferences",
        status: 400,
        userMessage: "Couldn't save your notification preferences. Please try again.",
      });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/mobile/notifications/preferences",
      status: 400,
      userMessage: "Couldn't save your notification preferences. Please try again.",
    });
  }
}
