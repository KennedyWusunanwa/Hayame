import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { failJson } from "@/lib/api-errors";

function extractBearerToken(req: Request): string | null {
  const raw = req.headers.get("authorization") ?? "";
  const [scheme, token] = raw.trim().split(/\s+/, 2);
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
}

function methodNotAllowed() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

function storageBucketCandidates() {
  return [
    process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET?.trim(),
    process.env.SUPABASE_AVATAR_BUCKET?.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim(),
    process.env.SUPABASE_STORAGE_BUCKET?.trim(),
    "avatars",
    "car-photos",
  ].filter(
    (value, index, array): value is string =>
      Boolean(value) && array.indexOf(value) === index,
  );
}

function isAvatarObjectName(name: string | null | undefined) {
  const normalized = String(name ?? "")
    .trim()
    .toLowerCase();
  return normalized.startsWith("avatar-");
}

async function resolveStoredAvatarUrl(
  admin: any,
  userId: string,
): Promise<string | null> {
  for (const bucket of storageBucketCandidates()) {
    const { data } = await admin.storage.from(bucket).list(userId, {
      limit: 30,
      sortBy: { column: "name", order: "desc" },
    });
    const match = (data ?? []).find((item: { name?: string | null }) =>
      isAvatarObjectName(item.name),
    );
    if (!match?.name) continue;
    const { data: publicData } = admin.storage
      .from(bucket)
      .getPublicUrl(`${userId}/${match.name}`);
    if (publicData?.publicUrl) return publicData.publicUrl;
  }
  return null;
}

export function POST() {
  return methodNotAllowed();
}

export async function GET(req: Request) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return NextResponse.json(
        { message: "Missing bearer token" },
        { status: 401 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return failJson({
        error: userError,
        req,
        route: "/api/mobile/me",
        status: 401,
        userMessage: "Your session has expired. Please sign in again.",
      });
    }

    let admin: any = null;
    try {
      admin = createSupabaseAdminClient() as any;
    } catch {
      admin = null;
    }

    let profile = null as {
      avatar_url?: string | null;
      is_host?: boolean;
    } | null;
    if (admin) {
      const { data: adminProfile } = await admin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      profile = (adminProfile ?? null) as {
        avatar_url?: string | null;
        is_host?: boolean;
      } | null;
    }
    if (!profile) {
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError && profileError.code !== "PGRST116") {
        return failJson({
          error: profileError,
          req,
          route: "/api/mobile/me",
          status: 400,
          userMessage: "We couldn't load your profile. Please try again.",
        });
      }
      profile = (profileRow ?? null) as {
        avatar_url?: string | null;
        is_host?: boolean;
      } | null;
    }

    if (admin && !profile?.avatar_url) {
      const fallbackAvatarUrl = await resolveStoredAvatarUrl(admin, user.id);
      if (fallbackAvatarUrl) {
        profile = {
          ...(profile ?? {}),
          avatar_url: fallbackAvatarUrl,
        };
      }
    }

    let hostApplicationRow: unknown = null;
    if (admin) {
      const { data: adminHostApplication } = await admin
        .from("host_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      hostApplicationRow = adminHostApplication ?? null;
    }
    if (!hostApplicationRow) {
      const { data: userHostApplication } = await supabase
        .from("host_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      hostApplicationRow = userHostApplication ?? null;
    }

    const hostApplication = (hostApplicationRow ?? null) as {
      status?: "pending" | "approved" | "rejected" | null;
    } | null;
    const hostStatus = hostApplication?.status ?? null;
    const isHost = Boolean(profile?.is_host) || hostStatus === "approved";

    return NextResponse.json({
      user,
      profile: profile ?? null,
      is_host: isHost,
      host_status: hostStatus,
      host_application_status: hostStatus,
      host_application: hostApplication ?? null,
    });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/mobile/me",
      status: 400,
      userMessage: "We couldn't load your account details. Please try again.",
    });
  }
}
