import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { queryAudit } from "@/lib/admin-audit-query";

export const dynamic = "force-dynamic";

function csvCell(value: string) {
  // Quote, and neutralise spreadsheet formulas.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const admin = await requireAdminApi("audit.export");
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const filters = Object.fromEntries(url.searchParams.entries());
  const lines = [["When (GMT)", "Admin", "Role", "Level", "Action", "Summary", "Target", "IP"].map(csvCell).join(",")];
  for (let page = 1; page <= 20; page += 1) {
    const { rows } = await queryAudit(filters, page, 500);
    for (const row of rows) {
      lines.push(
        [
          new Date(row.createdAt).toISOString(),
          row.adminEmail,
          row.adminRole,
          row.severity,
          row.label,
          row.summary,
          `${row.targetType} ${row.targetId}`.trim(),
          row.ip,
        ]
          .map(csvCell)
          .join(","),
      );
    }
    if (rows.length < 500) break;
  }

  await logAdminAction({
    action: "audit.exported",
    summary: `${admin.name} exported the audit log (${lines.length - 1} rows)`,
    severity: "important",
    actor: admin,
  });
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="hayame-audit-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
