import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createAdminSessionToken,
  verifyAdminCredentials,
} from "@/lib/admin-auth/session";
import {
  ADMIN_COOKIE_NAME as COOKIE_NAME,
  getAdminSessionSecret as getSessionSecret,
  getConfiguredPassword,
  getConfiguredPasswordHash,
  getConfiguredUsername,
  isAdminAuthConfigured,
  isValidAdminSessionToken,
} from "@/lib/admin-auth/config";

const SESSION_TTL_SECONDS = 60 * 60 * 12;

function getCookieSecure() {
  return process.env.NODE_ENV === "production";
}

export function getAdminReviewerName() {
  return getConfiguredUsername() || "admin";
}

export { isAdminAuthConfigured };

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return isValidAdminSessionToken(cookieStore.get(COOKIE_NAME)?.value);
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
