import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  email?: string;
  password?: string;
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
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ message: "email and password are required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error || !data.user) {
      return NextResponse.json({ message: error?.message ?? "Unable to sign up" }, { status: 400 });
    }

    return NextResponse.json({
      access_token: data.session?.access_token ?? null,
      refresh_token: data.session?.refresh_token ?? null,
      user: data.user,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message ?? "Unable to sign up" }, { status: 400 });
  }
}
