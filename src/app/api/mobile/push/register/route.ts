import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";

type Body = {
  deviceToken?: string;
  platform?: string;
};

function isPlaceholderValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === "your_apple_team_id" || normalized === "your_apns_key_id") return true;
  if (normalized.includes("your_apns_p8_key")) return true;
  if (normalized.includes("replace_me") || normalized.includes("placeholder")) return true;
  return false;
}

function hasConfiguredValue(value: string | undefined | null) {
  if (!value) return false;
  const normalized = value.trim();
  if (!normalized) return false;
  return !isPlaceholderValue(normalized);
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = (await req.json().catch(() => ({}))) as Body;
    const deviceToken = String(payload.deviceToken ?? "").trim();
    const platform = String(payload.platform ?? "ios").trim().toLowerCase();
    if (!deviceToken) {
      return NextResponse.json({ message: "deviceToken is required." }, { status: 400 });
    }
    if (platform !== "ios" && platform !== "android") {
      return NextResponse.json({ message: "platform must be ios or android." }, { status: 400 });
    }

    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();
    if (!admin) {
      return NextResponse.json({ registered: false, warning: "Supabase admin client not configured." });
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
      const lowered = message.toLowerCase();
      if (
        lowered.includes("does not exist") ||
        lowered.includes("relation") ||
        lowered.includes("could not find") ||
        lowered.includes("schema cache")
      ) {
        return NextResponse.json({
          registered: false,
          warning: "mobile_push_tokens table is not set up yet.",
        });
      }
      return NextResponse.json({ message }, { status: 400 });
    }

    const apnsConfigured =
      hasConfiguredValue(process.env.APNS_TEAM_ID) &&
      hasConfiguredValue(process.env.APNS_KEY_ID) &&
      hasConfiguredValue(process.env.APNS_PRIVATE_KEY);
    const fcmConfigured =
      hasConfiguredValue(process.env.FCM_SERVER_KEY) || hasConfiguredValue(process.env.FIREBASE_SERVER_KEY);

    if (platform === "ios" && !apnsConfigured) {
      return NextResponse.json({
        registered: true,
        warning: "Push token saved, but APNS server config is missing or still using placeholders.",
      });
    }
    if (platform === "android" && !fcmConfigured) {
      return NextResponse.json({
        registered: true,
        warning: "Push token saved, but FCM server config is missing or still using placeholders.",
      });
    }

    return NextResponse.json({ registered: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to register push token." }, { status: 400 });
  }
}
