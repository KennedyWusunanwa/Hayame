import Link from "next/link";
import { AdminNotice } from "@/components/admin/admin-notice";
import {
  PageHeader,
  Panel,
  SeverityPill,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/admin-auth";
import { AUDIT_PAGE_SIZE, queryAudit } from "@/lib/admin-audit-query";
import { ROLE_META, can, isAdminRole } from "@/lib/admin-permissions";

export const dynamic = "force-dynamic";

type SearchParams = { severity?: string; q?: string; admin?: string; from?: string; to?: string; page?: string };

function href(params: SearchParams, page: number) {
  const next = new URLSearchParams();
  Object.entries({ ...params, page: String(page) }).forEach(([key, value]) => {
    if (value) next.set(key, value);
  });
  return `/admin/audit?${next.toString()}`;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireAdmin("audit.view");
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const { rows, total, error } = await queryAudit(params, page);
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  const exportQuery = new URLSearchParams(
    Object.entries(params).filter(([key, value]) => key !== "page" && value) as [string, string][],
  ).toString();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Audit log"
        description="Every sensitive action: who did it, from where, and when. Entries can't be edited or deleted. Important and critical actions are emailed to every admin."
        actions={
          can(me.role, "audit.export") ? (
            <a href={`/api/admin/audit/export?${exportQuery}`} className={secondaryButtonClass}>
              Export CSV
            </a>
          ) : null
        }
      />
      {error ? <AdminNotice tone="error" title="Couldn't load the log" description={error} /> : null}

      <Panel>
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <input name="q" defaultValue={params.q ?? ""} placeholder="Search actions…" className={`${inputClass} lg:col-span-2`} aria-label="Search" />
          <input name="admin" defaultValue={params.admin ?? ""} placeholder="Admin email" className={inputClass} aria-label="Admin email" />
          <select name="severity" defaultValue={params.severity ?? ""} className={inputClass} aria-label="Severity">
            <option value="">All severities</option>
            <option value="important">Important and critical</option>
            <option value="critical">Critical only</option>
            <option value="info">Routine only</option>
          </select>
          <input name="from" type="date" defaultValue={params.from ?? ""} className={inputClass} aria-label="From date" />
          <input name="to" type="date" defaultValue={params.to ?? ""} className={inputClass} aria-label="To date" />
          <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
            <button type="submit" className={primaryButtonClass}>Filter</button>
            <Link href="/admin/audit" className={secondaryButtonClass}>Reset</Link>
            <span className="ml-auto self-center text-sm text-gray-500">{total.toLocaleString()} entries</span>
          </div>
        </form>
      </Panel>

      <Panel className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">When (GMT)</th>
                <th className="px-4 py-3 font-semibold">Who</th>
                <th className="px-4 py-3 font-semibold">What happened</th>
                <th className="px-4 py-3 font-semibold">Level</th>
                <th className="px-4 py-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Nothing matches those filters.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="align-top hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {new Date(row.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "medium", timeZone: "UTC" })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0A2B54]">{row.adminEmail || "System"}</p>
                      {isAdminRole(row.adminRole) ? <p className="text-xs text-gray-500">{ROLE_META[row.adminRole].label}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{row.summary}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {row.label}
                        {row.targetType ? ` · ${row.targetType}${row.targetId ? ` ${row.targetId.slice(0, 8).toUpperCase()}` : ""}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3"><SeverityPill severity={row.severity} /></td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">{row.ip || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {pages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href(params, page - 1)} className={secondaryButtonClass}>← Newer</Link> : <span />}
          <span className="text-gray-500">Page {page} of {pages}</span>
          {page < pages ? <Link href={href(params, page + 1)} className={secondaryButtonClass}>Older →</Link> : <span />}
        </div>
      ) : null}
    </div>
  );
}
