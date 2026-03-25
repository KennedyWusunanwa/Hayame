import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";

function isPlaceholderValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized === "your_apple_team_id" || normalized === "your_apns_key_id") return true;
  if (normalized.includes("your_apns_p8_key")) return true;
  if (normalized.includes("replace_me") || normalized.includes("placeholder")) return true;
  return false;
}

function hasValue(value: string | undefined | null) {
  if (!value) return false;
  const normalized = value.trim();
  if (!normalized) return false;
  return !isPlaceholderValue(normalized);
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();
    if (!admin) {
      return NextResponse.json({
        push: {
          configured: false,
          reason: "Supabase admin client is not configured.",
        },
      });
    }

    const { data, error } = await admin
      .from("mobile_push_tokens")
      .select("id,platform,device_token,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) {
      return NextResponse.json({ message: error.message ?? "Failed to load push status" }, { status: 400 });
    }

    const apnsConfigured =
      hasValue(process.env.APNS_TEAM_ID) &&
      hasValue(process.env.APNS_KEY_ID) &&
      hasValue(process.env.APNS_PRIVATE_KEY);
    const fcmConfigured = hasValue(process.env.FCM_SERVER_KEY) || hasValue(process.env.FIREBASE_SERVER_KEY);
    const topic = process.env.APNS_TOPIC?.trim() || process.env.IOS_BUNDLE_IDENTIFIER?.trim() || "com.hayame.app";
    const useSandbox = ["1", "true", "yes", "on"].includes((process.env.APNS_USE_SANDBOX ?? "").trim().toLowerCase());

    return NextResponse.json({
      push: {
        configured: apnsConfigured || fcmConfigured,
        apns: {
          teamIdConfigured: hasValue(process.env.APNS_TEAM_ID),
          keyIdConfigured: hasValue(process.env.APNS_KEY_ID),
          privateKeyConfigured: hasValue(process.env.APNS_PRIVATE_KEY),
          topic,
          useSandbox,
        },
        fcm: {
          serverKeyConfigured: fcmConfigured,
        },
        tokens: {
          total: (data ?? []).length,
          ios: (data ?? []).filter((row: any) => String(row?.platform ?? "").toLowerCase() === "ios").length,
          android: (data ?? []).filter((row: any) => String(row?.platform ?? "").toLowerCase() === "android").length,
          latestUpdatedAt: (data ?? [])[0]?.updated_at ?? null,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to fetch push status." }, { status: 400 });
  }
}
