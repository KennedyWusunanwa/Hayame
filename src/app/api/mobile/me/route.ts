import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ message: profileError.message ?? "Failed to load profile" }, { status: 400 });
    }

    return NextResponse.json({ user, profile: profile ?? null });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message ?? "Failed to load user" }, { status: 400 });
  }
}
