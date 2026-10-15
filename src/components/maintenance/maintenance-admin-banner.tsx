"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const COOKIE = "hayame_maint_admin";

function readFlag() {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`));
  return hit ? decodeURIComponent(hit.slice(COOKIE.length + 1)) : null;
}

/**
 * Shown only to signed-in admins while maintenance mode is on. The proxy sets a
 * short-lived cookie for them; everyone else never has it, so visitors can't see this.
 */
export function MaintenanceAdminBanner() {
  const [flag, setFlag] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setFlag(readFlag());
    try {
      setHidden(sessionStorage.getItem("maint-banner-hidden") === "1");
    } catch {
      // storage blocked: keep it visible
    }
  }, []);

  if (!flag || hidden) return null;
  const until = flag !== "indefinite" && !Number.isNaN(Date.parse(flag))
    ? new Date(flag).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " GMT"
    : null;

  return (
    <div
      role="status"
      className="fixed bottom-28 left-4 z-[70] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl bg-[#0A2B54] py-2.5 pl-4 pr-2.5 text-sm text-white shadow-[0_10px_30px_rgba(6,24,46,0.35)]"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
      </span>
      <span className="min-w-0 leading-snug">
        <strong className="font-bold">Maintenance mode is ON.</strong>{" "}
        <span className="text-white/80">
          Visitors see the maintenance page{until ? `, until ${until}` : ""}. Only signed-in admins see this site.
        </span>
      </span>
      <Link href="/admin/maintenance" className="shrink-0 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/25">
        Manage
      </Link>
      <button
        type="button"
        aria-label="Hide this notice"
        onClick={() => {
          setHidden(true);
          try {
            sessionStorage.setItem("maint-banner-hidden", "1");
          } catch {
            // ignore
          }
        }}
        className="shrink-0 rounded-lg px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white"
      >
        ×
      </button>
    </div>
  );
}
