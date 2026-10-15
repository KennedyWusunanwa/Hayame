import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { describeAction, type AdminSeverity } from "@/lib/admin-actions-catalog";

export type AuditFilters = {
  severity?: string;
  q?: string;
  admin?: string;
  from?: string;
  to?: string;
};

export type AuditRow = {
  id: string;
  createdAt: string;
  action: string;
  label: string;
  summary: string;
  severity: AdminSeverity;
  adminEmail: string;
  adminRole: string;
  ip: string;
  targetType: string;
  targetId: string;
};

export const AUDIT_PAGE_SIZE = 50;

function cleanTerm(value: string) {
  // Keep PostgREST's .or() filter syntax safe.
  return value.replace(/[,()%*\\]/g, " ").trim().slice(0, 80);
}

export async function queryAudit(filters: AuditFilters, page = 1, pageSize = AUDIT_PAGE_SIZE) {
  const db = createSupabaseAdminClient() as any;
  let query = db.from("admin_actions").select("*", { count: "exact" }).order("created_at", { ascending: false });

  if (filters.severity === "important") query = query.in("severity", ["important", "critical"]);
  else if (filters.severity === "critical" || filters.severity === "info") query = query.eq("severity", filters.severity);
  if (filters.admin) query = query.ilike("admin_email", `%${cleanTerm(filters.admin)}%`);
  if (filters.q) {
    const term = cleanTerm(filters.q);
    if (term) query = query.or(`action.ilike.%${term}%,summary.ilike.%${term}%,performed_by.ilike.%${term}%`);
  }
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) query = query.gte("created_at", `${filters.from}T00:00:00Z`);
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) query = query.lte("created_at", `${filters.to}T23:59:59Z`);

  const start = (Math.max(1, page) - 1) * pageSize;
  const { data, count, error } = await query.range(start, start + pageSize - 1);

  const rows: AuditRow[] = (data ?? []).map((row: any) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    const { label, severity } = describeAction(row.action);
    const rowSeverity = (row.severity ?? meta.severity ?? severity) as AdminSeverity;
    return {
      id: row.id,
      createdAt: row.created_at,
      action: row.action,
      label,
      summary: row.summary ?? (typeof meta.summary === "string" ? meta.summary : label),
      severity: rowSeverity === "critical" || rowSeverity === "important" ? rowSeverity : "info",
      adminEmail: row.admin_email ?? row.performed_by ?? "",
      adminRole: row.admin_role ?? "",
      ip: row.ip ?? "",
      targetType: row.target_type ?? "",
      targetId: row.target_id ?? "",
    };
  });
  return { rows, total: count ?? 0, error: error?.message ?? null };
}
