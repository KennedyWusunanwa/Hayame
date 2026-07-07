import Link from "next/link";
import { revalidatePath } from "next/cache";
import { AdminNotice } from "@/components/admin/admin-notice";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ErrorReport = {
  id: string;
  created_at: string | null;
  source: string | null;
  route: string | null;
  method: string | null;
  status: number | null;
  message: string | null;
  code: string | null;
  stack: string | null;
  user_id: string | null;
  app_version: string | null;
  platform: string | null;
  resolved: boolean | null;
};

type Filter = "unresolved" | "resolved" | "all";

function resolveFilter(raw?: string): Filter {
  if (raw === "resolved" || raw === "all") return raw;
  return "unresolved";
}

function isMissingTableError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const text = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return (
    text.includes("does not exist") ||
    text.includes("could not find") ||
    text.includes("schema cache") ||
    text.includes("relation") ||
    error.code === "42p01"
  );
}

function formatTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function resolveErrorAction(formData: FormData) {
  "use server";
  await requireAdminPage();
  const id = String(formData.get("id") ?? "").trim();
  const next = String(formData.get("next") ?? "true") === "true";
  if (!id) return;
  const admin = createSupabaseAdminClient() as any;
  await admin
    .from("error_reports")
    .update({
      resolved: next,
      resolved_at: next ? new Date().toISOString() : null,
    })
    .eq("id", id);
  revalidatePath("/admin/errors");
}

async function clearResolvedAction() {
  "use server";
  await requireAdminPage();
  const admin = createSupabaseAdminClient() as any;
  await admin.from("error_reports").delete().eq("resolved", true);
  revalidatePath("/admin/errors");
}

export default async function AdminErrorsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const filter = resolveFilter(params.filter);

  const admin = createSupabaseAdminClient() as any;

  let query = admin
    .from("error_reports")
    .select(
      "id,created_at,source,route,method,status,message,code,stack,user_id,app_version,platform,resolved",
    )
    .order("created_at", { ascending: false })
    .limit(300);
  if (filter === "unresolved") query = query.eq("resolved", false);
  if (filter === "resolved") query = query.eq("resolved", true);

  const { data, error } = await query;
  const reports = (data ?? []) as ErrorReport[];
  const tableMissing = isMissingTableError(error);

  const tabs: { key: Filter; label: string }[] = [
    { key: "unresolved", label: "Unresolved" },
    { key: "resolved", label: "Resolved" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Diagnostics
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Error reports
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Technical errors captured across web, iOS and Android. Users only
              ever see a friendly message — the real detail lands here.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-white"
          >
            ← Back to admin
          </Link>
        </div>

        {tableMissing ? (
          <AdminNotice
            tone="info"
            title="Set up the error_reports table"
            description="Run db/error-reports.sql (or the updated db/migration.sql) in the Supabase SQL editor to start capturing diagnostics. Until then, errors are still logged to the server (Vercel) logs."
          />
        ) : error ? (
          <AdminNotice
            tone="error"
            title="Couldn't load error reports"
            description="The diagnostics query failed. Check the server logs."
          />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1 rounded-lg border border-border bg-white p-1">
                {tabs.map((tab) => (
                  <Link
                    key={tab.key}
                    href={`/admin/errors?filter=${tab.key}`}
                    className={
                      filter === tab.key
                        ? "rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white"
                        : "rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
                    }
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
              {filter !== "unresolved" ? (
                <form action={clearResolvedAction}>
                  <PendingSubmitButton
                    className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                    pendingLabel="Clearing…"
                  >
                    Delete all resolved
                  </PendingSubmitButton>
                </form>
              ) : null}
            </div>

            {reports.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No {filter === "all" ? "" : filter} error reports. 🎉
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <Card key={report.id} className="overflow-hidden">
                    <CardHeader className="gap-2 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
                          {report.source ?? "web"}
                          {report.platform ? ` · ${report.platform}` : ""}
                        </span>
                        {report.status ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                            {report.status}
                          </span>
                        ) : null}
                        {report.code ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            {report.code}
                          </span>
                        ) : null}
                        <span className="text-[11px] text-muted-foreground">
                          {formatTime(report.created_at)}
                        </span>
                        {report.resolved ? (
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                            resolved
                          </span>
                        ) : null}
                      </div>
                      <CardTitle className="text-sm font-mono font-medium text-foreground">
                        {report.method ? `${report.method} ` : ""}
                        {report.route ?? "(unknown route)"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <p className="break-words rounded-md bg-red-50 px-3 py-2 font-mono text-xs text-red-800">
                        {report.message ?? "(no message)"}
                      </p>
                      {report.stack ? (
                        <details className="text-xs">
                          <summary className="cursor-pointer font-medium text-muted-foreground">
                            Stack trace
                          </summary>
                          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-[11px] text-foreground">
                            {report.stack}
                          </pre>
                        </details>
                      ) : null}
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-[11px] text-muted-foreground">
                          {report.user_id ? `user ${report.user_id}` : ""}
                          {report.app_version ? ` · v${report.app_version}` : ""}
                        </span>
                        <form action={resolveErrorAction}>
                          <input type="hidden" name="id" value={report.id} />
                          <input
                            type="hidden"
                            name="next"
                            value={report.resolved ? "false" : "true"}
                          />
                          <PendingSubmitButton
                            className={
                              report.resolved
                                ? "rounded-md border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                                : "rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
                            }
                            pendingLabel="Saving…"
                          >
                            {report.resolved ? "Reopen" : "Mark resolved"}
                          </PendingSubmitButton>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
