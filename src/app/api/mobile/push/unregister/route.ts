import { NextResponse } from "next/server";
import { failJson } from "@/lib/api-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";

type Body = {
  deviceToken?: string;
  platform?: string;
};

export async function DELETE(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = (await req.json().catch(() => ({}))) as Body;
    const deviceToken = String(payload.deviceToken ?? "").trim();
    const platform = String(payload.platform ?? "ios")
      .trim()
      .toLowerCase();

    if (!deviceToken) {
      return NextResponse.json(
        { message: "deviceToken is required." },
        { status: 400 },
      );
    }
    if (platform !== "ios" && platform !== "android") {
      return NextResponse.json(
        { message: "platform must be ios or android." },
        { status: 400 },
      );
    }

    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();
    if (!admin) {
      return NextResponse.json({
        unregistered: false,
        warning: "Supabase admin client not configured.",
      });
    }

    const { error, count } = await admin
      .from("mobile_push_tokens")
      .delete({ count: "exact" })
      .eq("user_id", user.id)
      .eq("platform", platform)
      .eq("device_token", deviceToken);

    if (error) {
      const message = String(error.message ?? "");
      const lowered = message.toLowerCase();
      if (
        lowered.includes("does not exist") ||
        lowered.includes("relation") ||
        lowered.includes("could not find") ||
        lowered.includes("schema cache")
      ) {
        return NextResponse.json({
          unregistered: false,
          warning: "mobile_push_tokens table is not set up yet.",
        });
      }
      return failJson({
        error,
        req,
        route: "/api/mobile/push/unregister",
        status: 400,
        userMessage: "Couldn't unregister your push token. Please try again.",
      });
    }

    return NextResponse.json({ unregistered: true, removed: count ?? 0 });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/mobile/push/unregister",
      status: 400,
      userMessage: "Couldn't unregister your push token. Please try again.",
    });
  }
}
