import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNotice } from "@/components/admin/admin-notice";
import { MaintenanceDesigner } from "@/components/admin/maintenance-designer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { invalidateMaintenanceCache } from "@/lib/maintenance";
import {
  isMaintenanceActive,
  parseMaintenanceForm,
  rowToSettings,
  settingsToRow,
} from "@/lib/maintenance-core";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function loadSettings() {
  const admin = createSupabaseAdminClient() as any;
  const { data, error } = await admin
    .from("site_maintenance")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  return { settings: rowToSettings(data), error: error?.message ?? null };
}

async function saveMaintenanceAction(formData: FormData) {
  "use server";
  const actor = await requireAdmin("maintenance.manage");

  const { settings: current, error: loadError } = await loadSettings();
  if (loadError) redirect(`/admin/maintenance?error=${encodeURIComponent(loadError)}`);

  const parsed = parseMaintenanceForm(formData, current);
  if (!parsed.ok) redirect(`/admin/maintenance?error=${encodeURIComponent(parsed.error)}`);

  const admin = createSupabaseAdminClient() as any;
  const { error } = await admin.from("site_maintenance").upsert({
    id: 1,
    ...settingsToRow(parsed.settings),
    updated_at: new Date().toISOString(),
    updated_by: actor.email,
  });
  if (error) redirect(`/admin/maintenance?error=${encodeURIComponent(error.message)}`);

  invalidateMaintenanceCache();
  const endsNote =
    parsed.settings.mode === "timed" && parsed.settings.endsAt
      ? ` until ${new Date(parsed.settings.endsAt).toISOString().replace("T", " ").slice(0, 16)} GMT`
      : parsed.settings.mode === "indefinite"
        ? " with no end time"
        : "";
  await logAdminAction({
    action:
      parsed.intent === "publish"
        ? "maintenance.enabled"
        : parsed.intent === "disable"
          ? "maintenance.disabled"
          : "maintenance.updated",
    summary:
      parsed.intent === "publish"
        ? `${actor.name} turned maintenance mode ON${endsNote}: visitors can no longer see the site`
        : parsed.intent === "disable"
          ? `${actor.name} turned maintenance mode OFF: the site is open to visitors`
          : `${actor.name} saved the maintenance page design`,
    targetType: "site",
    metadata: { mode: parsed.settings.mode, ends_at: parsed.settings.endsAt ?? "none" },
    actor,
  });
  const notice =
    parsed.intent === "publish" ? "live" : parsed.intent === "disable" ? "off" : "saved";
  redirect(`/admin/maintenance?notice=${notice}`);
}

const NOTICES: Record<string, { title: string; description: string }> = {
  live: {
    title: "Maintenance is on",
    description:
      "Visitors now see the maintenance page. You stay signed in as admin, so you can still browse the real site. It can take a few seconds to reach every server.",
  },
  off: { title: "Site is open", description: "Maintenance is off and visitors can use Hayame again." },
  saved: { title: "Design saved", description: "Status unchanged." },
};

function formatEnd(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export default async function AdminMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  await requireAdmin("maintenance.manage");
  const params = await searchParams;
  const { settings, error: loadError } = await loadSettings();
  const active = isMaintenanceActive(settings);
  const notice = params.notice ? NOTICES[params.notice] : null;
  const error = params.error ?? loadError;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Site"
        title="Maintenance mode"
        description="Hide the whole website behind a page you design. Admins who are signed in still see the real site."
      />

      <div className="space-y-3">
        {notice ? <AdminNotice tone="success" title={notice.title} description={notice.description} /> : null}
        {error ? (
          <AdminNotice
            tone="error"
            title="Couldn't save"
            description={
              /site_maintenance/.test(error)
                ? `${error}. Run db/site_maintenance.sql in the Supabase SQL editor first.`
                : error
            }
          />
        ) : null}
        <AdminNotice
          tone={active ? "error" : "info"}
          title={active ? "Site is hidden from visitors" : "Site is open"}
          description={
            active
              ? settings.mode === "timed" && settings.endsAt
                ? `Opens automatically on ${formatEnd(settings.endsAt)} GMT.`
                : "Stays hidden until you turn it off here."
              : settings.enabled
                ? "The timer has ended, so the site reopened by itself."
                : "Turn it on below. Admins signed in here always see the real site."
          }
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Design the page &amp; set the timing</CardTitle>
        </CardHeader>
        <CardContent>
          <MaintenanceDesigner initial={settings} action={saveMaintenanceAction} />
          <p className="mt-6 text-xs text-gray-500">
            Not hidden while on: this admin portal, <code>/api</code> (payments and the mobile
            apps keep working), and static files. See the real visitor page at{" "}
            <Link href="/maintenance" className="font-semibold text-brand" target="_blank">
              /maintenance
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
