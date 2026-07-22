import { NextResponse } from "next/server";
import { failJson } from "@/lib/api-errors";
import {
  createAccountAndSendVerification,
  findUserByEmail,
} from "@/lib/auth-mail";
import { checkRateLimit, clientIp, humanRetryAfter } from "@/lib/rate-limit";
import { validatePassword } from "@/lib/password";

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

export function GET() {
  return methodNotAllowed();
}

/**
 * Creates the account and sends the Hayame-branded verification email.
 *
 * Deliberately does NOT use `supabase.auth.signUp()`: that hands delivery to
 * Supabase's shared SMTP, whose limiter silently dropped verification mail and
 * left real signups stranded as unconfirmed. See src/lib/auth-mail.ts.
 */
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
        { message: "Enter your email and a password to create your account." },
        { status: 400 },
      );
    }
    const passwordProblem = validatePassword(password);
    if (passwordProblem) {
      return NextResponse.json(
        { code: "weak_password", message: passwordProblem },
        { status: 400 },
      );
    }

    // Signup creates a user and sends mail, so cap it per IP.
    const limit = await checkRateLimit({
      scope: "signup",
      identifier: clientIp(req),
      limit: 5,
      windowSeconds: 60 * 15,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        {
          code: "rate_limited",
          message: `Too many signup attempts. Please try again ${humanRetryAfter(limit.retryAfterSeconds)}.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        },
      );
    }

    // Say plainly that the address is taken — the user needs to log in or
    // resend, and discovering that by a failed signup is a dead end.
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        {
          code: existing.email_confirmed_at
            ? "email_taken"
            : "email_taken_unverified",
          message: existing.email_confirmed_at
            ? "An account already uses this email. Try logging in instead."
            : "You already signed up with this email but haven't verified it yet. Check your inbox, or tap Resend verification email.",
        },
        { status: 409 },
      );
    }

    const result = await createAccountAndSendVerification({
      email,
      password,
      metadata: {
        full_name: fullName || undefined,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        city: city || undefined,
        region: region || undefined,
      },
    });

    if (!result.ok) {
      return failJson({
        error: new Error(`signup failed: ${result.reason}`),
        req,
        route: "/api/mobile/auth/signup",
        status: 400,
        userMessage: "We couldn't create your account. Please try again.",
      });
    }

    return NextResponse.json({
      // No session is issued: the account must be verified before it can log in.
      access_token: null,
      refresh_token: null,
      requires_email_confirmation: true,
      message:
        "Account created. Check your email for a verification link, then log in.",
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
