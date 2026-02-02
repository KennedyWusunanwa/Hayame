"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminTabsProps = {
  overview: ReactNode;
  applications: ReactNode;
};

export function AdminTabs({ overview, applications }: AdminTabsProps) {
  const [tab, setTab] = useState<"overview" | "applications">("overview");

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-6 bg-white/95 px-6 py-3 shadow-sm backdrop-blur md:hidden">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTab("overview")}
            className={cn(
              "rounded-full border px-3 py-2 text-sm font-semibold",
              tab === "overview"
                ? "border-brand bg-brand text-white"
                : "border-border bg-white text-gray-700",
            )}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setTab("applications")}
            className={cn(
              "rounded-full border px-3 py-2 text-sm font-semibold",
              tab === "applications"
                ? "border-brand bg-brand text-white"
                : "border-border bg-white text-gray-700",
            )}
          >
            Applications
          </button>
        </div>
      </div>

      <div className={cn(tab === "overview" ? "block" : "hidden", "md:block")}>{overview}</div>
      <div className={cn(tab === "applications" ? "block" : "hidden", "md:block")}>
        {applications}
      </div>
    </div>
  );
}
