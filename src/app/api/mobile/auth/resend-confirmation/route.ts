import { NextResponse } from "next/server";
import { failJson } from "@/lib/api-errors";
import { sendVerificationEmail } from "@/lib/auth-mail";
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
 * Re-sends the Hayame-branded verification email.
 *
 * Unlike password reset, this flow answers honestly about the account's state.
 * Someone standing on the "unverified email" wall needs to know whether to wait
 * for mail, log in, or sign up — and they already know the address exists,
 * because they just typed it into a login form that told them so.
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

    const perEmail = await checkRateLimit({
      scope: "resend-confirmation",
      identifier: email,
      limit: 3,
      windowSeconds: 60 * 15,
    });
    if (!perEmail.allowed) {
      return NextResponse.json(
        {
          code: "rate_limited",
          message: `We've already sent a verification link. Check your inbox and spam folder, or try again ${humanRetryAfter(perEmail.retryAfterSeconds)}.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(perEmail.retryAfterSeconds) },
        },
      );
    }

    const perIp = await checkRateLimit({
      scope: "resend-confirmation-ip",
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

    const result = await sendVerificationEmail({ email });

    if (!result.ok) {
      if (result.reason === "no_account") {
        return NextResponse.json(
          {
            code: "no_account",
            message:
              "We couldn't find an account with this email. Sign up to create one.",
          },
          { status: 404 },
        );
      }
      if (result.reason === "already_verified") {
        return NextResponse.json(
          {
            code: "already_verified",
            message:
              "This email is already verified. You can log in with your password.",
          },
          { status: 409 },
        );
      }
      return failJson({
        error: new Error("verification link generation failed"),
        req,
        route: "/api/mobile/auth/resend-confirmation",
        status: 400,
        userMessage:
          "We couldn't resend your verification email. Please try again.",
      });
    }

    return NextResponse.json({
      message:
        "Verification email sent. Check your inbox — and your spam folder.",
    });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/mobile/auth/resend-confirmation",
      status: 400,
      userMessage:
        "We couldn't resend your verification email. Please try again.",
    });
  }
}
