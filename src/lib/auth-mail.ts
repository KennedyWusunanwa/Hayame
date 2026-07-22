import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildPasswordResetEmail,
  buildVerifyEmail,
  sendEmailSafe,
} from "@/lib/email";

/**
 * Verification and password-reset mail, sent by us rather than by Supabase.
 *
 * Why we don't use `auth.signUp()` / `auth.resetPasswordForEmail()` to deliver:
 *
 *   1. Branding — those go out on Supabase's stock template.
 *   2. Deliverability — they go through Supabase's shared SMTP, whose limiter
 *      rejects bursts with `over_email_send_rate_limit`. That silently stranded
 *      real signups as unconfirmed.
 *   3. Broken landings — Supabase rewrites `redirect_to` to the project's Site
 *      URL when the target isn't in the dashboard allow-list. That URL was
 *      still `http://localhost:3000`, so every verification link dumped the
 *      user on a dead page after confirming.
 *
 * Instead we ask the admin API for the link, keep only its `hashed_token`, and
 * build a URL on our own domain (`/auth/verify`). That page redeems the token
 * with `verifyOtp`, so Supabase's Site URL and redirect allow-list stop
 * mattering — nothing to misconfigure.
 */

const siteUrl =
  process.env.EMAIL_BASE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.hayamegh.com";

export type AuthLinkType = "signup" | "recovery";

type GenerateResult =
  | { ok: true; url: string; fullName: string | null; userId: string | null }
  | { ok: false; reason: "no_account" | "already_verified" | "failed" };

/**
 * `generate_link` returns the user record with `hashed_token` alongside it. The
 * REST shape puts these at the top level; supabase-js nests them under
 * `properties`, so read both.
 */
function readHashedToken(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, any>;
  const direct = record.hashed_token;
  if (typeof direct === "string" && direct) return direct;
  const nested = record.properties?.hashed_token;
  if (typeof nested === "string" && nested) return nested;
  return null;
}

function readFullName(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, any>;
  const meta = record.user?.user_metadata ?? record.user_metadata;
  const name = meta?.full_name ?? meta?.first_name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

function readUserId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, any>;
  const id = record.user?.id ?? record.id;
  return typeof id === "string" && id ? id : null;
}

/** Builds the on-our-domain URL that redeems `hashed_token`. */
export function buildAuthActionUrl(type: AuthLinkType, hashedToken: string) {
  const path = type === "recovery" ? "/auth/reset-password" : "/auth/verify";
  const url = new URL(path, siteUrl);
  url.searchParams.set("token_hash", hashedToken);
  url.searchParams.set("type", type);
  return url.toString();
}

async function generateLink(params: {
  type: AuthLinkType;
  email: string;
  password?: string;
  metadata?: Record<string, unknown>;
}): Promise<GenerateResult> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: params.type,
    email: params.email,
    ...(params.password ? { password: params.password } : {}),
    ...(params.metadata ? { options: { data: params.metadata } } : {}),
  } as any);

  if (error) {
    const message = (error.message || "").toLowerCase();
    if (message.includes("not found") || message.includes("no user")) {
      return { ok: false, reason: "no_account" };
    }
    // Regenerating a `signup` link for an already-confirmed account is
    // rejected — there is nothing left to verify.
    if (message.includes("already") && message.includes("confirm")) {
      return { ok: false, reason: "already_verified" };
    }
    console.error("[auth-mail] generateLink failed", {
      type: params.type,
      message: error.message,
    });
    return { ok: false, reason: "failed" };
  }

  const hashedToken = readHashedToken(data);
  if (!hashedToken) {
    console.error("[auth-mail] generateLink returned no hashed_token");
    return { ok: false, reason: "failed" };
  }

  return {
    ok: true,
    url: buildAuthActionUrl(params.type, hashedToken),
    fullName: readFullName(data),
    userId: readUserId(data),
  };
}

async function upsertProfile(
  userId: string,
  metadata: Record<string, unknown>,
) {
  const text = (key: string) => {
    const value = metadata[key];
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };

  try {
    const admin = createSupabaseAdminClient() as any;
    const { error } = await admin.from("profiles").upsert(
      {
        id: userId,
        first_name: text("first_name"),
        last_name: text("last_name"),
        full_name: text("full_name"),
        city: text("city"),
        region: text("region"),
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  } catch (error) {
    // A missing profile row is recoverable later; a failed signup is not.
    console.error("[auth-mail] profile upsert failed", error);
  }
}

export type SendResult =
  | { ok: true }
  | { ok: false; reason: "no_account" | "already_verified" | "failed" };

/**
 * Creates the auth user AND sends the branded verification email. Used by both
 * the web and mobile signup paths so there is exactly one signup code path.
 */
export async function createAccountAndSendVerification(params: {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}): Promise<SendResult> {
  const link = await generateLink({
    type: "signup",
    email: params.email,
    password: params.password,
    metadata: params.metadata,
  });
  if (!link.ok) return link;

  const fullName =
    (typeof params.metadata?.full_name === "string"
      ? (params.metadata.full_name as string)
      : null) ?? link.fullName;

  // A database trigger also creates this row, but it doesn't carry `region`
  // (every profile had region NULL despite signup collecting it). Upserting
  // here makes the profile correct and complete regardless of the trigger, and
  // is idempotent if the trigger already ran.
  if (link.userId) {
    await upsertProfile(link.userId, params.metadata ?? {});
  }

  const email = buildVerifyEmail({ verifyUrl: link.url, fullName });
  await sendEmailSafe({
    to: params.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  return { ok: true };
}

/** Re-sends verification to an account that already exists but is unconfirmed. */
export async function sendVerificationEmail(params: {
  email: string;
}): Promise<SendResult> {
  const existing = await findUserByEmail(params.email);
  if (!existing) return { ok: false, reason: "no_account" };
  if (existing.email_confirmed_at) {
    return { ok: false, reason: "already_verified" };
  }

  // A fresh `signup` link is valid for an existing unconfirmed user and
  // invalidates the previous token.
  const link = await generateLink({ type: "signup", email: params.email });
  if (!link.ok) return link;

  const email = buildVerifyEmail({
    verifyUrl: link.url,
    fullName: existing.full_name ?? link.fullName,
  });
  await sendEmailSafe({
    to: params.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  return { ok: true };
}

export async function sendPasswordResetEmail(params: {
  email: string;
}): Promise<SendResult> {
  const link = await generateLink({ type: "recovery", email: params.email });
  if (!link.ok) return link;

  const email = buildPasswordResetEmail({
    resetUrl: link.url,
    fullName: link.fullName,
  });
  await sendEmailSafe({
    to: params.email,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  return { ok: true };
}

export type FoundUser = {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  full_name: string | null;
};

/**
 * Looks up an auth user by email. `listUsers` has no server-side email filter,
 * so we page through — fine at Hayame's user count, and the alternative
 * (querying `auth.users` directly) isn't exposed over PostgREST.
 */
export async function findUserByEmail(
  email: string,
): Promise<FoundUser | null> {
  const admin = createSupabaseAdminClient();
  const needle = email.trim().toLowerCase();
  const perPage = 200;

  for (let page = 1; page <= 25; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      console.error("[auth-mail] listUsers failed", error.message);
      return null;
    }
    const users = data?.users ?? [];
    const match = users.find(
      (user) => (user.email ?? "").toLowerCase() === needle,
    );
    if (match) {
      const meta = (match.user_metadata ?? {}) as Record<string, unknown>;
      const fullName =
        typeof meta.full_name === "string" && meta.full_name.trim()
          ? meta.full_name.trim()
          : null;
      return {
        id: match.id,
        email: match.email ?? needle,
        email_confirmed_at: match.email_confirmed_at ?? null,
        full_name: fullName,
      };
    }
    if (users.length < perPage) break;
  }
  return null;
}
