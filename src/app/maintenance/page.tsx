import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MaintenanceView } from "@/components/maintenance/maintenance-view";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getMaintenanceSettings } from "@/lib/maintenance";
import { DEFAULT_MAINTENANCE, isMaintenanceActive } from "@/lib/maintenance-core";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hayame · Back soon",
  robots: { index: false, follow: false },
};

export default async function MaintenancePage() {
  const settings = (await getMaintenanceSettings()) ?? DEFAULT_MAINTENANCE;
  // Visitors only land here while maintenance is live. Admins may open it to preview.
  if (!isMaintenanceActive(settings) && !(await isAdminAuthenticated())) {
    redirect("/");
  }
  return (
    <>
      {/* The page covers the whole screen; also drop the site chrome from the DOM flow. */}
      <style>{"[data-site-chrome]{display:none!important}"}</style>
      <MaintenanceView settings={settings} />
    </>
  );
}
