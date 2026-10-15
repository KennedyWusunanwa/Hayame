import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createAdminPasswordHash,
  createAdminSessionToken,
  verifyAdminCredentials,
  verifyAdminPassword,
} from "@/lib/admin-auth/session";
import {
  ADMIN_COOKIE_NAME as COOKIE_NAME,
  getAdminSessionSecret as getSessionSecret,
  getConfiguredPassword,
  getConfiguredPasswordHash,
  getConfiguredUsername,
  isAdminAuthConfigured,
} from "@/lib/admin-auth/config";
import { logAdminAction, getRequestMeta } from "@/lib/admin-audit";
import { getCurrentAdmin, rootIdentity, type AdminIdentity } from "@/lib/admin-identity";
import { can, isAdminRole, type Permission } from "@/lib/admin-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SESSION_TTL_SECONDS = 60 * 60 * 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const IP_FAILURE_LIMIT = 10;

export { isAdminAuthConfigured, getCurrentAdmin };
export type { AdminIdentity };

function getCookieSecure() {
  return process.env.NODE_ENV === "production";
}

export async function isAdminAuthenticated() {
  return (await getCurrentAdmin()) !== null;
}

/**
 * Guard for admin pages and server actions. Sends signed-out people to the
 * sign-in screen, forces a password change after a reset, and bounces anyone
 * whose role lacks the permission.
 */
export async function requireAdmin(permission?: Permission): Promise<AdminIdentity> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin");
  if (admin.mustChangePassword) redirect("/admin/account?force=1");
  if (permission && !can(admin.role, permission)) redirect("/admin?notice=forbidden");
  return admin;
}

/** Back-compat alias for pages that only need "signed in". */
export async function requireAdminPage(permission?: Permission) {
  return requireAdmin(permission);
}

export async function requireAdminApi(permission?: Permission) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.mustChangePassword) return null;
  if (permission && !can(admin.role, permission)) return null;
  return admin;
}

export function validateNewPassword(password: string, email = "") {
  if (password.length < 10) return "Use at least 10 characters.";
  if (!/[a-z]/i.test(password) || !/\d/.test(password))
    return "Use a mix of letters and numbers.";
  if (email && password.toLowerCase().includes(email.split("@")[0].toLowerCase()))
    return "Don't put your email name in the password.";
  return null;
}

let dummyHash: string | null = null;
function burnTime(password: string) {
  // Same scrypt cost whether or not the account exists, so timing doesn't reveal it.
  dummyHash ??= createAdminPasswordHash("not-a-real-password");
  verifyAdminPassword(password, dummyHash);
}

async function setSessionCookie(username: string, adminId?: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    COOKIE_NAME,
    createAdminSessionToken({
      username,
      adminId,
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
}

async function tooManyFailuresFromIp(ip: string | null) {
  if (!ip) return false;
  try {
    const db = createSupabaseAdminClient() as any;
    const since = new Date(Date.now() - LOCK_MINUTES * 60_000).toISOString();
    const { count } = await db
      .from("admin_actions")
      .select("id", { count: "exact", head: true })
      .eq("action", "admin.login_failed")
      .eq("ip", ip)
      .gte("created_at", since);
    return (count ?? 0) >= IP_FAILURE_LIMIT;
  } catch {
    return false;
  }
}

export type SignInResult = "ok" | "invalid" | "locked" | "missing";

/**
 * Team accounts sign in with email + password. The env-configured username keeps
 * working as the root super admin so a bad migration can never lock everyone out.
 */
export async function signInAdmin(identifier: string, password: string): Promise<SignInResult> {
  if (!isAdminAuthConfigured()) return "missing";
  const typed = identifier.trim();
  const email = typed.toLowerCase();
  const { ip } = await getRequestMeta();

  if (await tooManyFailuresFromIp(ip)) {
    burnTime(password);
    await logAdminAction({
      action: "admin.login_blocked",
      summary: `Sign-in blocked for ${typed || "unknown"}: too many failed tries from this IP`,
      actor: null,
    });
    return "locked";
  }

  const fail = async (reason: string): Promise<SignInResult> => {
    await logAdminAction({
      action: "admin.login_failed",
      summary: `Failed sign-in for ${typed || "unknown"} (${reason})`,
      actor: null,
    });
    return "invalid";
  };

  const db = createSupabaseAdminClient() as any;
  let team: any = null;
  if (email.includes("@")) {
    try {
      const { data } = await db.from("admin_users").select("*").eq("email", email).maybeSingle();
      team = data;
    } catch {
      team = null;
    }
  }

  if (team) {
    if (!team.active || !isAdminRole(team.role)) {
      burnTime(password);
      return fail("inactive account");
    }
    if (team.locked_until && Date.parse(team.locked_until) > Date.now()) {
      burnTime(password);
      return "locked";
    }
    if (!verifyAdminPassword(password, team.password_hash)) {
      const attempts = (team.failed_attempts ?? 0) + 1;
      const lock = attempts >= MAX_FAILED_ATTEMPTS;
      await db
        .from("admin_users")
        .update({
          failed_attempts: lock ? 0 : attempts,
          locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null,
        })
        .eq("id", team.id);
      if (lock) {
        await logAdminAction({
          action: "admin.account_locked",
          summary: `${team.email} was locked for ${LOCK_MINUTES} minutes after ${MAX_FAILED_ATTEMPTS} wrong passwords`,
          targetType: "admin",
          targetId: team.id,
          actor: null,
        });
        return "locked";
      }
      return fail("wrong password");
    }

    await db
      .from("admin_users")
      .update({ failed_attempts: 0, locked_until: null, last_login_at: new Date().toISOString(), last_login_ip: ip })
      .eq("id", team.id);
    await setSessionCookie(team.email, team.id);
    await logAdminAction({
      action: "admin.login",
      summary: `${team.full_name} signed in`,
      actor: { id: team.id, email: team.email, name: team.full_name, role: team.role },
    });
    return "ok";
  }

  const rootOk = verifyAdminCredentials({
    inputUsername: typed,
    inputPassword: password,
    configuredUsername: getConfiguredUsername(),
    configuredPassword: getConfiguredPassword(),
    configuredPasswordHash: getConfiguredPasswordHash(),
  });
  if (!rootOk) {
    burnTime(password);
    return fail("unknown account or wrong password");
  }
  await setSessionCookie(getConfiguredUsername());
  await logAdminAction({
    action: "admin.login",
    summary: "Root admin signed in",
    actor: rootIdentity(),
  });
  return "ok";
}

export async function signOutAdmin() {
  const admin = await getCurrentAdmin();
  if (admin) {
    await logAdminAction({ action: "admin.logout", summary: `${admin.name} signed out`, actor: admin });
  }
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: getCookieSecure(),
    path: "/",
    maxAge: 0,
  });
}
