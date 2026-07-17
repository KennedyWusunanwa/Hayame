"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readConsent, writeConsent } from "@/lib/analytics/consent";
import { resolvePendingEvents } from "@/lib/analytics/client";
import { cn } from "@/lib/utils";

/**
 * Analytics consent banner.
 *
 * Deliberate choices, each of which is a compliance requirement rather than a
 * style preference:
 *   * "Decline" is the same size and weight as "Accept". A reject option that
 *     is harder to find than accept is the specific pattern EU regulators have
 *     repeatedly fined companies for, and it is free to avoid.
 *   * No pre-ticked boxes and no "by continuing to browse you agree" — neither
 *     is valid consent anywhere.
 *   * Dismissing without choosing is NOT consent. There is no X button; the
 *     banner stays until a real choice is made, and until then nothing is
 *     stored on the device.
 *   * It says plainly what we collect and what we do not. "We value your
 *     privacy" tells the reader nothing.
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Read on mount only: the server has no idea what this visitor chose, so
    // rendering the banner during SSR would flash it for people who already
    // decided.
    setVisible(readConsent() === null);
  }, []);

  function decide(granted: boolean) {
    writeConsent(granted ? "granted" : "denied");
    resolvePendingEvents(granted);
    setVisible(false);
    // Record proof-of-consent server-side. Best-effort — a failure here must
    // not block the visitor, and the local decision still stands.
    void fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analytics: granted, platform: "web" }),
    }).catch(() => {});
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-border/80 bg-white p-4 shadow-lg sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p
              id="consent-title"
              className="text-sm font-semibold text-gray-900"
            >
              Help us improve Hayame?
            </p>
            <p className="text-sm leading-relaxed text-gray-600">
              We&apos;d like to measure how people search and book on Hayame so we
              can fix what&apos;s broken. This stays with us — we don&apos;t use
              advertising trackers and we never sell your data.{" "}
              <Link
                href="/privacy"
                className="font-semibold text-brand underline underline-offset-2"
              >
                Read our privacy policy
              </Link>
              .
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => decide(false)}
              className={cn(
                "min-h-10 rounded-xl border border-border bg-white px-4 py-2",
                "text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50",
              )}
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => decide(true)}
              className={cn(
                "min-h-10 rounded-xl border border-brand bg-brand px-4 py-2",
                "text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-90",
              )}
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
