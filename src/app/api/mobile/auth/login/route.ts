import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { failJson } from "@/lib/api-errors";
import { findUserByEmail } from "@/lib/auth-mail";
import { checkRateLimit, clientIp, humanRetryAfter } from "@/lib/rate-limit";

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

/**
 * Password login, with the three failure cases reported separately:
 *
 *   no_account          — nothing is registered at this address
 *   email_not_confirmed — right password, but the address was never verified
 *   wrong_password      — the account exists and the password is wrong
 *
 * Supabase collapses the first and third into `invalid_credentials` on purpose,
 * to stop attackers enumerating which addresses have accounts. We deliberately
 * un-collapse them because "wrong email or password" is a dead end for a real
 * user who simply typo'd — and we buy back the safety with the per-IP limiter
 * below, which makes scripted harvesting impractical.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { message: "Enter your email and password." },
        { status: 400 },
      );
    }

    // The enumeration guard. Distinguishing "no account" from "wrong password"
    // is only safe while this holds.
    const ipLimit = await checkRateLimit({
      scope: "login-ip",
      identifier: clientIp(req),
      limit: 20,
      windowSeconds: 60 * 10,
    });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          code: "rate_limited",
          message: `Too many login attempts. Please try again ${humanRetryAfter(ipLimit.retryAfterSeconds)}.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
        },
      );
    }

    // Slows password guessing against one specific account without affecting
    // anyone else sharing the same NAT/IP.
    const accountLimit = await checkRateLimit({
      scope: "login-account",
      identifier: email,
      limit: 10,
      windowSeconds: 60 * 10,
    });
    if (!accountLimit.allowed) {
      return NextResponse.json(
        {
          code: "rate_limited",
          message: `Too many attempts for this account. Please try again ${humanRetryAfter(accountLimit.retryAfterSeconds)}.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(accountLimit.retryAfterSeconds) },
        },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.session && data.user) {
      return NextResponse.json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: data.user,
      });
    }

    // Supabase reports the unverified case distinctly; trust it and skip the
    // lookup.
    const code = (error as any)?.code ?? "";
    if (code === "email_not_confirmed") {
      return NextResponse.json(
        {
          code: "email_not_confirmed",
          message:
            "Your email address hasn't been verified yet. Check your inbox for the verification link, or tap Resend verification email.",
        },
        { status: 403 },
      );
    }

    // Otherwise decide between "no account" and "wrong password".
    const existing = await findUserByEmail(email);
    if (!existing) {
      return NextResponse.json(
        {
          code: "no_account",
          message:
            "We couldn't find an account with this email. Check the spelling, or sign up.",
        },
        { status: 404 },
      );
    }

    if (!existing.email_confirmed_at) {
      return NextResponse.json(
        {
          code: "email_not_confirmed",
          message:
            "Your email address hasn't been verified yet. Check your inbox for the verification link, or tap Resend verification email.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        code: "wrong_password",
        message: "Wrong password. Try again, or reset your password.",
      },
      { status: 401 },
    );
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/mobile/auth/login",
      status: 400,
      userMessage: "We couldn't log you in. Please try again.",
    });
  }
}
