import { NextResponse } from "next/server";
import { failJson } from "@/lib/api-errors";
import { sendPasswordResetEmail } from "@/lib/auth-mail";
import { checkRateLimit, clientIp, humanRetryAfter } from "@/lib/rate-limit";

type Body = {
  email?: string;
};

function methodNotAllowed() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export function GET() {
  return methodNotAllowed();
}

/**
 * Sends the Hayame-branded password reset email.
 *
 * The previous implementation called `resetPasswordForEmail()`, which delegated
 * delivery to Supabase. Its limiter rejected repeat taps with
 * `over_email_send_rate_limit` ("you can only request this after 48 seconds"),
 * and because that surfaced as a thrown AuthApiError it was filed as an error
 * report rather than shown to the user as a wait. We now throttle before
 * sending and answer with a plain countdown.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    if (!email) {
      return NextResponse.json(
        { message: "Enter your email address." },
        { status: 400 },
      );
    }

    // Per-address, so one person tapping twice can't lock out anyone else.
    const perEmail = await checkRateLimit({
      scope: "password-reset",
      identifier: email,
      limit: 3,
      windowSeconds: 60 * 15,
    });
    if (!perEmail.allowed) {
      return NextResponse.json(
        {
          code: "rate_limited",
          message: `We've already sent a reset link. Check your inbox and spam folder, or try again ${humanRetryAfter(perEmail.retryAfterSeconds)}.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(perEmail.retryAfterSeconds) },
        },
      );
    }

    const perIp = await checkRateLimit({
      scope: "password-reset-ip",
      identifier: clientIp(req),
      limit: 10,
      windowSeconds: 60 * 15,
    });
    if (!perIp.allowed) {
      return NextResponse.json(
        {
          code: "rate_limited",
          message: `Too many requests. Please try again ${humanRetryAfter(perIp.retryAfterSeconds)}.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(perIp.retryAfterSeconds) },
        },
      );
    }

    const result = await sendPasswordResetEmail({ email });

    // A missing account is not surfaced: password reset is the one flow where
    // confirming an address exists is a real gift to an attacker, and unlike
    // login there is no usability cost to staying vague.
    if (!result.ok && result.reason === "failed") {
      return failJson({
        error: new Error("password reset link generation failed"),
        req,
        route: "/api/mobile/auth/forgot-password",
        status: 400,
        userMessage:
          "We couldn't send the password reset email. Please try again.",
      });
    }

    return NextResponse.json({
      message:
        "If an account uses this email, a password reset link is on its way.",
    });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/mobile/auth/forgot-password",
      status: 400,
      userMessage:
        "We couldn't send the password reset email. Please try again.",
    });
  }
}
