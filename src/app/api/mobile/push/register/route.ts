import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { getPushConfigurationStatus } from "@/lib/push";

type Body = {
  deviceToken?: string;
  previousDeviceToken?: string;
  platform?: string;
};

function isMissingPushTableError(message: string) {
  const lowered = message.toLowerCase();
  return (
    lowered.includes("does not exist") ||
    lowered.includes("relation") ||
    lowered.includes("could not find") ||
    lowered.includes("schema cache")
  );
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = (await req.json().catch(() => ({}))) as Body;
    const deviceToken = String(payload.deviceToken ?? "").trim();
    const previousDeviceToken = String(payload.previousDeviceToken ?? "").trim();
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
        registered: false,
        warning: "Supabase admin client not configured.",
      });
    }

    const deleteSameTokenElsewhere = await admin
      .from("mobile_push_tokens")
      .delete()
      .eq("platform", platform)
      .eq("device_token", deviceToken)
      .neq("user_id", user.id);
    if (deleteSameTokenElsewhere.error) {
      const message = String(deleteSameTokenElsewhere.error.message ?? "");
      if (isMissingPushTableError(message)) {
        return NextResponse.json({
          registered: false,
          warning: "mobile_push_tokens table is not set up yet.",
        });
      }
      return NextResponse.json({ message }, { status: 400 });
    }

    if (previousDeviceToken && previousDeviceToken !== deviceToken) {
      const previousDelete = await admin
        .from("mobile_push_tokens")
        .delete()
        .eq("user_id", user.id)
        .eq("platform", platform)
        .eq("device_token", previousDeviceToken);
      if (previousDelete.error) {
        const message = String(previousDelete.error.message ?? "");
        if (isMissingPushTableError(message)) {
          return NextResponse.json({
            registered: false,
            warning: "mobile_push_tokens table is not set up yet.",
          });
        }
        return NextResponse.json({ message }, { status: 400 });
      }
    }

    const { error } = await admin.from("mobile_push_tokens").upsert(
      {
        user_id: user.id,
        platform,
        device_token: deviceToken,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform,device_token" },
    );

    if (error) {
      const message = String(error.message ?? "");
      if (isMissingPushTableError(message)) {
        return NextResponse.json({
          registered: false,
          warning: "mobile_push_tokens table is not set up yet.",
        });
      }
      return NextResponse.json({ message }, { status: 400 });
    }

    const pushStatus = getPushConfigurationStatus();
    if (platform === "ios" && !pushStatus.apns.configured) {
      return NextResponse.json({
        registered: true,
        warning:
          "Push token saved, but APNS server config is missing or still using placeholders.",
      });
    }
    if (platform === "android" && !pushStatus.fcm.configured) {
      return NextResponse.json({
        registered: true,
        warning:
          "Push token saved, but FCM server config is missing or still using placeholders.",
      });
    }

    return NextResponse.json({ registered: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Failed to register push token." },
      { status: 400 },
    );
  }
}
