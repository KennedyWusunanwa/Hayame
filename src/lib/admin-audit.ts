import "server-only";
import { headers } from "next/headers";
import { getAdminNotificationRecipients, buildAdminActivityEmail, sendToEachSafe } from "@/lib/email";
import { describeAction, type AdminSeverity } from "@/lib/admin-actions-catalog";
import { getCurrentAdmin, type AdminIdentity } from "@/lib/admin-identity";
import { ROLE_META } from "@/lib/admin-permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type LogAdminActionInput = {
  action: string;
  /** One plain sentence, e.g. "Refunded GH₵120 on booking 3F2A9C1B". Shown in the log and the email. */
  summary?: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  /** Overrides the catalog severity. */
  severity?: AdminSeverity;
  /** Pass when the session cookie isn't set yet (sign-in) or you already hold the identity. */
  actor?: AdminIdentity | { email: string; name: string; role: AdminIdentity["role"]; id: string } | null;
  /** Skip the email even for important actions (used for the actor's own routine events). */
  silent?: boolean;
};

export async function getRequestMeta() {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    return {
      ip: forwarded || h.get("x-real-ip") || null,
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    };
  } catch {
    return { ip: null, userAgent: null };
  }
}

/** Every admin who should hear about important actions: active team accounts plus the env inboxes. */
async function getNotificationEmails(): Promise<string[]> {
  const emails = new Set(getAdminNotificationRecipients().map((e) => e.toLowerCase()));
  try {
    const db = createSupabaseAdminClient() as any;
    const { data } = await db.from("admin_users").select("email").eq("active", true);
    for (const row of data ?? []) if (row.email) emails.add(String(row.email).toLowerCase());
  } catch {
    // table not created yet: env recipients only
  }
  return Array.from(emails).filter((e) => e.includes("@"));
}

/**
 * Writes the audit row and, for important/critical actions, emails every admin.
 * Never throws: a logging or mail failure must not undo the action itself.
 */
export async function logAdminAction(input: LogAdminActionInput) {
  try {
    const actor = input.actor === undefined ? await getCurrentAdmin() : input.actor;
    const { label, severity: catalogSeverity } = describeAction(input.action);
    const severity = input.severity ?? catalogSeverity;
    const meta = await getRequestMeta();
    const summary = input.summary ?? label;
    const performedBy = actor ? actor.email : "system";

    const db = createSupabaseAdminClient() as any;
    const row = {
      action: input.action,
      target_id: input.targetId ?? null,
      target_type: input.targetType ?? null,
      metadata: input.metadata ?? null,
      performed_by: performedBy,
      admin_id: actor?.id ?? null,
      admin_email: actor?.email ?? null,
      admin_role: actor?.role ?? null,
      ip: meta.ip,
      user_agent: meta.userAgent,
      summary,
      severity,
    };
    let { error } = await db.from("admin_actions").insert(row);
    if (error && /column .* does not exist|schema cache/i.test(error.message ?? "")) {
      // Migration not run yet: fall back to the original columns so logging still works.
      ({ error } = await db.from("admin_actions").insert({
        action: row.action,
        target_id: row.target_id,
        target_type: row.target_type,
        metadata: { ...(row.metadata ?? {}), summary, severity },
        performed_by: row.performed_by,
      }));
    }
    if (error) console.error("[admin-audit] insert failed", error.message);

    if (severity === "info" || input.silent) return;
    const to = await getNotificationEmails();
    if (to.length === 0) return;
    const template = buildAdminActivityEmail({
      severity,
      actionLabel: label,
      summary,
      actorName: actor?.name ?? "System",
      actorEmail: actor?.email ?? "",
      actorRole: actor ? ROLE_META[actor.role].label : "",
      ip: meta.ip,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      details: input.metadata ?? null,
    });
    // One copy each, so a single bad address cannot hide the alert from everyone.
    await sendToEachSafe(to, { subject: template.subject, html: template.html, text: template.text });
  } catch (error) {
    console.error("[admin-audit] failed", error);
  }
}
