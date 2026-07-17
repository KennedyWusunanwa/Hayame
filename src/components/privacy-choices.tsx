"use client";

import { useEffect, useState } from "react";
import {
  clearAnalyticsStorage,
  readConsent,
  writeConsent,
  type ConsentDecision,
} from "@/lib/analytics/consent";
import { cn } from "@/lib/utils";

/**
 * Lets someone see and change their analytics choice after the banner is gone.
 *
 * This is a requirement, not a courtesy: Apple App Review Guideline 5.1.1(ii)
 * demands "an easily accessible and understandable way to withdraw consent",
 * and GDPR Art. 7(3) requires withdrawal to be as easy as giving consent. A
 * banner with no way back is not compliant.
 *
 * Lives on /privacy so there is one stable, linkable place to find it.
 */
export function PrivacyChoices() {
  const [decision, setDecision] = useState<ConsentDecision | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDecision(readConsent()?.analytics ?? null);
  }, []);

  function choose(next: ConsentDecision) {
    writeConsent(next);
    if (next === "denied") clearAnalyticsStorage();
    setDecision(next);
    setSaved(true);
    void fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analytics: next === "granted", platform: "web" }),
    }).catch(() => {});
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-700">
        Current choice:{" "}
        <span className="font-semibold">
          {decision === "granted"
            ? "Analytics on"
            : decision === "denied"
              ? "Analytics off"
              : "Not chosen yet"}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => choose("granted")}
          className={cn(
            "min-h-10 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
            decision === "granted"
              ? "border-brand bg-brand text-white"
              : "border-border bg-white text-gray-700 hover:bg-gray-50",
          )}
        >
          Turn analytics on
        </button>
        <button
          type="button"
          onClick={() => choose("denied")}
          className={cn(
            "min-h-10 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
            decision === "denied"
              ? "border-brand bg-brand text-white"
              : "border-border bg-white text-gray-700 hover:bg-gray-50",
          )}
        >
          Turn analytics off
        </button>
      </div>
      {saved ? (
        <p className="text-xs font-medium text-brand" role="status">
          Saved. Turning analytics off also deletes the analytics id stored in
          this browser.
        </p>
      ) : null}
    </div>
  );
}
