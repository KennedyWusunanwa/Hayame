import type { ReactNode } from "react";
import { AdminShell, type ShellNavGroup } from "@/components/admin/admin-shell";
import { getCurrentAdmin } from "@/lib/admin-identity";
import { can, type Permission } from "@/lib/admin-permissions";
import { getMaintenanceSettings } from "@/lib/maintenance";
import { isMaintenanceActive } from "@/lib/maintenance-core";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { signOutAction } from "@/app/admin/shell-actions";

export const dynamic = "force-dynamic";

async function pendingApplications() {
  try {
    const db = createSupabaseAdminClient() as any;
    const { count } = await db
      .from("host_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin();
  // Signed out (sign-in screen) or forced to change a temporary password: no navigation.
  if (!admin || admin.mustChangePassword) return <>{children}</>;

  const pending = can(admin.role, "applications.review") ? await pendingApplications() : 0;
  const maintenanceSettings = await getMaintenanceSettings();
  const maintenanceOn = isMaintenanceActive(maintenanceSettings);
  const maintenanceUntil =
    maintenanceOn && maintenanceSettings?.mode === "timed" && maintenanceSettings.endsAt
      ? new Date(maintenanceSettings.endsAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " GMT"
      : null;
  const allow = (permission: Permission) => can(admin.role, permission);
  const anyOf = (...permissions: Permission[]) => permissions.some(allow);

  const raw: { title: string; items: (ShellNavGroup["items"][number] & { show: boolean })[] }[] = [
    {
      title: "Overview",
      items: [{ label: "Dashboard", href: "/admin?tab=overview", icon: "overview", show: allow("overview.view") }],
    },
    {
      title: "Operations",
      items: [
        { label: "Applications", href: "/admin?tab=applications", icon: "applications", badge: pending, show: allow("applications.review") },
        { label: "Hosts", href: "/admin?tab=hosts", icon: "hosts", show: allow("hosts.view") },
        { label: "Vehicles", href: "/admin?tab=vehicles", icon: "vehicles", show: allow("vehicles.review") },
        { label: "Users", href: "/admin?tab=users", icon: "users", show: allow("users.view") },
        { label: "Messages", href: "/admin/messages", icon: "messages", show: allow("messages.reply") },
      ],
    },
    {
      title: "Trust & money",
      items: [
        {
          label: "Moderation & finance",
          href: "/admin/platform",
          icon: "controls",
          show: anyOf("vehicles.review", "bookings.refund", "disputes.resolve", "reviews.moderate", "announcements.send", "platform.fee"),
        },
        { label: "Analytics", href: "/admin/analytics", icon: "analytics", show: allow("analytics.view") },
      ],
    },
    {
      title: "Site",
      items: [
        { label: "Maintenance mode", href: "/admin/maintenance", icon: "maintenance", flag: maintenanceOn ? "ON" : undefined, show: allow("maintenance.manage") },
        { label: "Car makes & models", href: "/admin/filters", icon: "filters", show: allow("filters.manage") },
        { label: "Error reports", href: "/admin/errors", icon: "errors", show: allow("errors.view") },
      ],
    },
    {
      title: "Admin",
      items: [
        { label: "Team & roles", href: "/admin/team", icon: "team", show: allow("team.manage") },
        { label: "Audit log", href: "/admin/audit", icon: "audit", show: allow("audit.view") },
        { label: "My account", href: "/admin/account", icon: "account", show: true },
      ],
    },
  ];
  const groups: ShellNavGroup[] = raw
    .map((group) => ({
      title: group.title,
      items: group.items
        .filter((item) => item.show)
        .map((item) => ({ label: item.label, href: item.href, icon: item.icon, badge: item.badge, flag: item.flag })),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <AdminShell
      groups={groups}
      user={{ name: admin.name, email: admin.email, role: admin.role }}
      signOutAction={signOutAction}
      maintenance={maintenanceOn ? { until: maintenanceUntil } : null}
    >
      {children}
    </AdminShell>
  );
}
