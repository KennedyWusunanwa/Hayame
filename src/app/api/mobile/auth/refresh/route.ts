import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  refresh_token?: string;
};

function methodNotAllowed() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export function GET() {
  return methodNotAllowed();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const refreshToken = String(body.refresh_token ?? "").trim();

    if (!refreshToken) {
      return NextResponse.json({ message: "refresh_token is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      return NextResponse.json({ message: error?.message ?? "Unable to refresh session" }, { status: 401 });
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message ?? "Unable to refresh session" }, { status: 400 });
  }
}
