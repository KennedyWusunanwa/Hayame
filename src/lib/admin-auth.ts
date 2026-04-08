import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createAdminSessionToken,
  verifyAdminCredentials,
  verifyAdminSessionToken,
} from "@/lib/admin-auth/session";

const COOKIE_NAME = "hayame_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function normalize(value: string | undefined | null) {
  return value?.trim() ?? "";
}

function getConfiguredUsername() {
  return normalize(process.env.ADMIN_USERNAME);
}

function getConfiguredPassword() {
  return normalize(process.env.ADMIN_PASSWORD);
}

function getConfiguredPasswordHash() {
  return normalize(process.env.ADMIN_PASSWORD_HASH);
}

function getSessionSecret() {
  const explicitSecret = normalize(process.env.ADMIN_SESSION_SECRET);
  if (explicitSecret) return explicitSecret;

  const seed = [
    normalize(process.env.SUPABASE_SERVICE_ROLE_KEY),
    getConfiguredUsername(),
    getConfiguredPasswordHash(),
    getConfiguredPassword(),
  ]
    .filter(Boolean)
    .join(":");

  if (!seed) return "";
  return createHash("sha256").update(seed).digest("hex");
}

function getCookieSecure() {
  return process.env.NODE_ENV === "production";
}

export function getAdminReviewerName() {
  return getConfiguredUsername() || "admin";
}

export function isAdminAuthConfigured() {
  return Boolean(
    getConfiguredUsername() &&
    (getConfiguredPassword() || getConfiguredPasswordHash()) &&
    getSessionSecret(),
  );
}

export async function isAdminAuthenticated() {
  if (!isAdminAuthConfigured()) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAdminSessionToken({
    token,
    sessionSecret: getSessionSecret(),
    expectedUsername: getConfiguredUsername(),
  });
}

export async function requireAdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
}

export async function requireAdminApi() {
  return isAdminAuthenticated();
}

export async function signInAdmin(username: string, password: string) {
  if (!isAdminAuthConfigured()) return "missing" as const;

  const verified = verifyAdminCredentials({
    inputUsername: username.trim(),
    inputPassword: password,
    configuredUsername: getConfiguredUsername(),
    configuredPassword: getConfiguredPassword(),
    configuredPasswordHash: getConfiguredPasswordHash(),
  });

  if (!verified) return "invalid" as const;

  const cookieStore = await cookies();
  cookieStore.set(
    COOKIE_NAME,
    createAdminSessionToken({
      username: getConfiguredUsername(),
      sessionSecret: getSessionSecret(),
      ttlSeconds: SESSION_TTL_SECONDS,
    }),
    {
      httpOnly: true,
      sameSite: "strict",
      secure: getCookieSecure(),
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    },
  );

  return "ok" as const;
}

export async function signOutAdmin() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: getCookieSecure(),
    path: "/",
    maxAge: 0,
  });
}
