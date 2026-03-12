import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

export function POST() {
  return methodNotAllowed();
}

export async function GET(req: Request) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return NextResponse.json({ message: "Missing bearer token" }, { status: 401 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ message: userError?.message ?? "Unauthorized" }, { status: 401 });
    }

    let admin: any = null;
    try {
      admin = createSupabaseAdminClient() as any;
    } catch {
      admin = null;
    }

    let profile = null as { is_host?: boolean } | null;
    if (admin) {
      const { data: adminProfile } = await admin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      profile = (adminProfile ?? null) as { is_host?: boolean } | null;
    }
    if (!profile) {
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError && profileError.code !== "PGRST116") {
        return NextResponse.json({ message: profileError.message ?? "Failed to load profile" }, { status: 400 });
      }
      profile = (profileRow ?? null) as { is_host?: boolean } | null;
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

    const hostApplication = (hostApplicationRow ?? null) as { status?: "pending" | "approved" | "rejected" | null } | null;
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
    return NextResponse.json({ message: error?.message ?? "Failed to load user" }, { status: 400 });
  }
}
