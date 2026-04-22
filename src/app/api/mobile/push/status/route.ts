import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { getPushConfigurationStatus } from "@/lib/push";

function isMissingPushTableError(message: string) {
  const lowered = message.toLowerCase();
  return (
    lowered.includes("does not exist") ||
    lowered.includes("relation") ||
    lowered.includes("could not find") ||
    lowered.includes("schema cache")
  );
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
      const message = String(error.message ?? "");
      if (isMissingPushTableError(message)) {
        return NextResponse.json({
          push: {
            ...getPushConfigurationStatus(),
            reason: "mobile_push_tokens table is not set up yet.",
            tokens: {
              total: 0,
              ios: 0,
              android: 0,
              latestUpdatedAt: null,
            },
          },
        });
      }
      return NextResponse.json(
        { message: error.message ?? "Failed to load push status" },
        { status: 400 },
      );
    }

    const config = getPushConfigurationStatus();
    return NextResponse.json({
      push: {
        ...config,
        tokens: {
          total: (data ?? []).length,
          ios: (data ?? []).filter(
            (row: any) => String(row?.platform ?? "").toLowerCase() === "ios",
          ).length,
          android: (data ?? []).filter(
            (row: any) =>
              String(row?.platform ?? "").toLowerCase() === "android",
          ).length,
          latestUpdatedAt: (data ?? [])[0]?.updated_at ?? null,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Failed to fetch push status." },
      { status: 400 },
    );
  }
}
