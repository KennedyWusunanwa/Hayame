"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type AdminTabsProps = {
  initialTab?: "overview" | "applications";
  overview: ReactNode;
  applications: ReactNode;
};

export function AdminTabs({
  initialTab = "overview",
  overview,
  applications,
}: AdminTabsProps) {
  const [tab, setTab] = useState<"overview" | "applications">(initialTab);
  const [isPending, pendingTransition] = useTransition();

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  function handleTabChange(nextTab: "overview" | "applications") {
    if (nextTab === tab) return;
    pendingTransition(() => setTab(nextTab));
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl border border-border/80 bg-white p-2 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="px-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
              Admin sections
            </p>
            {isPending ? (
              <span className="mt-1 inline-flex items-center gap-2 text-xs font-semibold text-brand">
                <Spinner size={12} />
                Loading section...
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => handleTabChange("overview")}
              className={cn(
                "min-h-10 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                tab === "overview"
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-border bg-white text-gray-700 hover:bg-gray-50",
              )}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("applications")}
              className={cn(
                "min-h-10 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                tab === "applications"
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-border bg-white text-gray-700 hover:bg-gray-50",
              )}
            >
              Applications
            </button>
          </div>
        </div>
      </div>

      <div
        aria-busy={isPending}
        className={cn(
          "transition-opacity duration-150",
          isPending ? "opacity-70" : "opacity-100",
          tab === "overview" ? "block" : "hidden",
        )}
      >
        {overview}
      </div>
      <div
        aria-busy={isPending}
        className={cn(
          "transition-opacity duration-150",
          isPending ? "opacity-70" : "opacity-100",
          tab === "applications" ? "block" : "hidden",
        )}
      >
        {applications}
      </div>
    </div>
  );
}
