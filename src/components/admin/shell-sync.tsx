"use client";

import { useEffect } from "react";

/**
 * Next keeps a layout alive across client navigations, so the admin shell
 * (decided by who is signed in) can go stale after signing out, expiry or the
 * forced password change. This reloads once when the page and the chrome
 * disagree.
 */
export function ShellSync({ expect }: { expect: "shell" | "bare" }) {
  useEffect(() => {
    const hasShell = Boolean(document.querySelector("[data-admin-shell]"));
    const mismatch = expect === "shell" ? !hasShell : hasShell;
    if (!mismatch) return;
    try {
      if (sessionStorage.getItem("admin-shell-sync") === "1") return;
      sessionStorage.setItem("admin-shell-sync", "1");
    } catch {
      // storage blocked: still reload once per mount
    }
    window.location.reload();
  }, [expect]);

  useEffect(() => {
    try {
      sessionStorage.removeItem("admin-shell-sync");
    } catch {
      // ignore
    }
  }, []);
  return null;
}
