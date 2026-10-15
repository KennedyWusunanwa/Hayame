"use server";

import { redirect } from "next/navigation";
import { getCurrentAdmin, validateNewPassword } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { createAdminPasswordHash, verifyAdminPassword } from "@/lib/admin-auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PasswordState = { error?: string } | null;

export async function changeOwnPasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin");
  if (admin.source === "root")
    return { error: "The root admin password is set in your hosting environment variables, not here." };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next !== confirm) return { error: "The two new passwords don't match." };
  const problem = validateNewPassword(next, admin.email);
  if (problem) return { error: problem };

  const db = createSupabaseAdminClient() as any;
  const { data: row } = await db.from("admin_users").select("password_hash").eq("id", admin.id).maybeSingle();
  if (!row || !verifyAdminPassword(current, row.password_hash))
    return { error: "Your current password is wrong." };
  if (verifyAdminPassword(next, row.password_hash))
    return { error: "Choose a password you haven't used." };

  const { error } = await db
    .from("admin_users")
    .update({
      password_hash: createAdminPasswordHash(next),
      must_change_password: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", admin.id);
  if (error) return { error: error.message };

  await logAdminAction({
    action: "admin.password_changed",
    summary: `${admin.name} changed their own password`,
    targetType: "admin",
    targetId: admin.id,
    actor: admin,
  });
  redirect("/admin?notice=password-changed");
}
