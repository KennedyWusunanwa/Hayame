import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { failJson } from "@/lib/api-errors";

type Body = {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  region?: string;
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
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");
    const firstName = String(body.first_name ?? "").trim();
    const lastName = String(body.last_name ?? "").trim();
    const city = String(body.city ?? "").trim();
    const region = String(body.region ?? "").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

    if (!email || !password) {
      return NextResponse.json(
        { message: "email and password are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: resolveEmailRedirectURL(req),
        data: {
          full_name: fullName || undefined,
          first_name: firstName || undefined,
          last_name: lastName || undefined,
          city: city || undefined,
          region: region || undefined,
        },
      },
    });

    if (error || !data.user) {
      return failJson({
        error,
        req,
        route: "/api/mobile/auth/signup",
        status: 400,
        userMessage: "We couldn't create your account. Please try again.",
      });
    }

    return NextResponse.json({
      access_token: data.session?.access_token ?? null,
      refresh_token: data.session?.refresh_token ?? null,
      user: data.user,
      requires_email_confirmation: !data.session,
    });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/mobile/auth/signup",
      status: 400,
      userMessage: "We couldn't create your account. Please try again.",
    });
  }
}
