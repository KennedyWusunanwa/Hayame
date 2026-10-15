// Admin session config shared by the server helpers and the proxy.
// Deliberately free of `server-only` and `next/headers` so the proxy can import it.
import { createHash } from "node:crypto";
import { readAdminSessionToken } from "@/lib/admin-auth/session";

export const ADMIN_COOKIE_NAME = "hayame_admin_session";

function normalize(value: string | undefined | null) {
  return value?.trim() ?? "";
}

export function getConfiguredUsername() {
  return normalize(process.env.ADMIN_USERNAME);
}

export function getConfiguredPassword() {
  return normalize(process.env.ADMIN_PASSWORD);
}

export function getConfiguredPasswordHash() {
  return normalize(process.env.ADMIN_PASSWORD_HASH);
}

export function getAdminSessionSecret() {
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

export function isAdminAuthConfigured() {
  return Boolean(
    getConfiguredUsername() &&
    (getConfiguredPassword() || getConfiguredPasswordHash()) &&
    getAdminSessionSecret(),
  );
}

/** The signed claims inside a valid, unexpired admin cookie, or null. */
export function readAdminSession(token: string | undefined | null) {
  if (!token || !isAdminAuthConfigured()) return null;
  const claims = readAdminSessionToken({ token, sessionSecret: getAdminSessionSecret() });
  if (!claims) return null;
  // Root session: must still match the configured username.
  if (!claims.adminId && claims.username !== getConfiguredUsername()) return null;
  return claims;
}

export function isValidAdminSessionToken(token: string | undefined | null) {
  return readAdminSession(token) !== null;
}
