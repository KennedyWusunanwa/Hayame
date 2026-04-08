"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type AdminTabsProps = {
  overview: ReactNode;
  applications: ReactNode;
};

export function AdminTabs({ overview, applications }: AdminTabsProps) {
  const [tab, setTab] = useState<"overview" | "applications">("overview");
  const [isPending, pendingTransition] = useTransition();

  function handleTabChange(nextTab: "overview" | "applications") {
    if (nextTab === tab) return;
    pendingTransition(() => setTab(nextTab));
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-6 bg-white/95 px-6 py-3 shadow-sm backdrop-blur md:hidden">
        <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-gray-500">
          <span>Admin sections</span>
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size={12} />
              Loading...
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleTabChange("overview")}
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
            onClick={() => handleTabChange("applications")}
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

      <div
        aria-busy={isPending}
        className={cn(
          "transition-opacity duration-150",
          isPending ? "opacity-70" : "opacity-100",
          tab === "overview" ? "block" : "hidden",
          "md:block",
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
          "md:block",
        )}
      >
        {applications}
      </div>
    </div>
  );
}
