import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  getConfiguredUsername,
  readAdminSession,
} from "@/lib/admin-auth/config";
import { isAdminRole, type AdminRole } from "@/lib/admin-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminIdentity = {
  /** admin_users.id, or "root" for the env-configured admin. */
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  source: "root" | "team";
  mustChangePassword: boolean;
};

export function rootIdentity(): AdminIdentity {
  const username = getConfiguredUsername() || "admin";
  return {
    id: "root",
    email: username,
    name: "Root admin",
    role: "super_admin",
    source: "root",
    mustChangePassword: false,
  };
}

/** Who is signed in right now, re-checked against the database on every request. */
export const getCurrentAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const cookieStore = await cookies();
  const claims = readAdminSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  if (!claims) return null;
  if (!claims.adminId) return rootIdentity();

  try {
    const db = createSupabaseAdminClient() as any;
    const { data } = await db
      .from("admin_users")
      .select("id,email,full_name,role,active,must_change_password")
      .eq("id", claims.adminId)
      .maybeSingle();
    if (!data || !data.active || !isAdminRole(data.role)) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.full_name,
      role: data.role,
      source: "team",
      mustChangePassword: data.must_change_password === true,
    };
  } catch {
    return null;
  }
});
