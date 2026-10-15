"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { requireAdmin, hasRootCredentials } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { createAdminPasswordHash } from "@/lib/admin-auth/session";
import { ROLE_META, isAdminRole } from "@/lib/admin-permissions";
import { buildAdminWelcomeEmail, sendEmailSafe } from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type TeamActionState = {
  ok?: boolean;
  error?: string;
  email?: string;
  tempPassword?: string;
} | null;

const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateTempPassword() {
  for (;;) {
    const bytes = randomBytes(14);
    const value = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
    if (/[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value)) return value;
  }
}

function db() {
  return createSupabaseAdminClient() as any;
}

/** Active super admins that would remain, counting the env-configured root admin. */
async function activeSuperAdminCount(excludingId?: string) {
  const { data } = await db().from("admin_users").select("id").eq("role", "super_admin").eq("active", true);
  const team = (data ?? []).filter((row: { id: string }) => row.id !== excludingId).length;
  return team + (hasRootCredentials() ? 1 : 0);
}

export async function createAdminAccountAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const actor = await requireAdmin("team.manage");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  if (name.length < 2) return { error: "Add the person's name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email doesn't look right." };
  if (!isAdminRole(role)) return { error: "Pick a role." };

  const tempPassword = generateTempPassword();
  const { data, error } = await db()
    .from("admin_users")
    .insert({
      email,
      full_name: name,
      role,
      password_hash: createAdminPasswordHash(tempPassword),
      must_change_password: true,
      created_by: actor.email,
    })
    .select("id")
    .single();
  if (error) {
    if (/duplicate|unique/i.test(error.message)) return { error: "An admin with that email already exists." };
    if (/admin_users/.test(error.message))
      return { error: "Run db/admin_roles_audit.sql in Supabase first, then try again." };
    return { error: error.message };
  }

  await logAdminAction({
    action: "admin.created",
    summary: `${actor.name} created an admin account for ${name} (${email}) as ${ROLE_META[role].label}`,
    targetType: "admin",
    targetId: data.id,
    metadata: { email, role },
    actor,
  });
  const welcome = buildAdminWelcomeEmail({
    name,
    email,
    roleLabel: ROLE_META[role].label,
    roleDescription: ROLE_META[role].description,
    createdBy: actor.name,
  });
  await sendEmailSafe({ to: email, subject: welcome.subject, html: welcome.html, text: welcome.text });
  return { ok: true, email, tempPassword };
}

export async function resetAdminPasswordAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const actor = await requireAdmin("team.manage");
  const id = String(formData.get("id") ?? "");
  const { data: target } = await db().from("admin_users").select("id,email,full_name").eq("id", id).maybeSingle();
  if (!target) return { error: "Admin not found." };

  const tempPassword = generateTempPassword();
  const { error } = await db()
    .from("admin_users")
    .update({
      password_hash: createAdminPasswordHash(tempPassword),
      must_change_password: true,
      failed_attempts: 0,
      locked_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  await logAdminAction({
    action: "admin.password_reset",
    summary: `${actor.name} reset the password for ${target.full_name} (${target.email})`,
    targetType: "admin",
    targetId: id,
    actor,
  });
  return { ok: true, email: target.email, tempPassword };
}

export async function changeAdminRoleAction(formData: FormData) {
  const actor = await requireAdmin("team.manage");
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!isAdminRole(role)) redirect("/admin/team?error=Pick%20a%20role.");
  if (id === actor.id) redirect("/admin/team?error=You%20can%27t%20change%20your%20own%20role.");

  const { data: target } = await db().from("admin_users").select("id,email,full_name,role,active").eq("id", id).maybeSingle();
  if (!target) redirect("/admin/team?error=Admin%20not%20found.");
  if (target.role === role) redirect("/admin/team");
  if (target.role === "super_admin" && target.active && (await activeSuperAdminCount(id)) < 1)
    redirect("/admin/team?error=There%20must%20always%20be%20at%20least%20one%20super%20admin.");

  const { error } = await db().from("admin_users").update({ role, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(`/admin/team?error=${encodeURIComponent(error.message)}`);
  await logAdminAction({
    action: "admin.role_changed",
    summary: `${actor.name} changed ${target.full_name} (${target.email}) from ${ROLE_META[target.role as keyof typeof ROLE_META]?.label ?? target.role} to ${ROLE_META[role].label}`,
    targetType: "admin",
    targetId: id,
    metadata: { from: target.role, to: role },
    actor,
  });
  redirect("/admin/team?notice=role");
}

export async function setAdminActiveAction(formData: FormData) {
  const actor = await requireAdmin("team.manage");
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (id === actor.id) redirect("/admin/team?error=You%20can%27t%20deactivate%20yourself.");

  const { data: target } = await db().from("admin_users").select("id,email,full_name,role,active").eq("id", id).maybeSingle();
  if (!target) redirect("/admin/team?error=Admin%20not%20found.");
  if (!active && target.role === "super_admin" && target.active && (await activeSuperAdminCount(id)) < 1)
    redirect("/admin/team?error=There%20must%20always%20be%20at%20least%20one%20super%20admin.");

  const { error } = await db()
    .from("admin_users")
    .update({ active, failed_attempts: 0, locked_until: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) redirect(`/admin/team?error=${encodeURIComponent(error.message)}`);
  await logAdminAction({
    action: active ? "admin.reactivated" : "admin.deactivated",
    summary: `${actor.name} ${active ? "reactivated" : "deactivated"} ${target.full_name} (${target.email})`,
    targetType: "admin",
    targetId: id,
    actor,
  });
  redirect(`/admin/team?notice=${active ? "reactivated" : "deactivated"}`);
}
