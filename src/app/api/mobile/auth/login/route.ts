import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  email?: string;
  password?: string;
};

const WRONG_EMAIL_OR_PASSWORD_MESSAGE = "Wrong email or password.";

function methodNotAllowed() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export function GET() {
  return methodNotAllowed();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { message: "email and password are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { message: WRONG_EMAIL_OR_PASSWORD_MESSAGE },
        { status: 401 },
      );
    }

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message ?? "Unable to login" },
      { status: 400 },
    );
  }
}
