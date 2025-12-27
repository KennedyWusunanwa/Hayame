import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireUser();

  return (
    <div className="mx-auto flex max-w-6xl gap-0 px-0 lg:px-0">
      <DashboardSidebar />
      <div className="flex-1 border-l border-border bg-gray-50/60 px-4 py-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
