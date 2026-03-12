import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  email?: string;
};

function methodNotAllowed() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

function resolveEmailRedirectURL(req: Request) {
  const configured =
    process.env.NEXT_PUBLIC_AUTH_CONFIRMATION_REDIRECT_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured;
  try {
    return new URL(req.url).origin;
  } catch {
    return "https://www.hayamegh.com";
  }
}

export function GET() {
  return methodNotAllowed();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ message: "email is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: resolveEmailRedirectURL(req),
      },
    });

    if (error) {
      return NextResponse.json({ message: error.message ?? "Unable to resend confirmation email" }, { status: 400 });
    }

    return NextResponse.json({
      message: "If this account exists, a confirmation email has been sent.",
    });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message ?? "Unable to resend confirmation email" }, { status: 400 });
  }
}
