"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Car,
  ClipboardCheck,
  Construction,
  FileClock,
  IdCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  UserRound,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { RoleBadge } from "@/components/admin/admin-ui";
import type { AdminRole } from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  applications: ClipboardCheck,
  verifications: IdCard,
  payments: Wallet,
  hosts: ShieldCheck,
  vehicles: Car,
  users: Users,
  messages: MessageSquare,
  controls: Settings2,
  analytics: BarChart3,
  maintenance: Construction,
  filters: SlidersHorizontal,
  errors: AlertTriangle,
  team: UserCog,
  audit: FileClock,
  account: UserRound,
};

export type ShellNavItem = { label: string; href: string; icon: keyof typeof ICONS; badge?: number; flag?: string };
export type ShellNavGroup = { title: string; items: ShellNavItem[] };

function isActive(item: ShellNavItem, pathname: string, tab: string | null) {
  const [path, query] = item.href.split("?");
  if (path === "/admin") {
    if (pathname !== "/admin") return false;
    const wanted = new URLSearchParams(query ?? "").get("tab") ?? "overview";
    return (tab ?? "overview") === wanted;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

function NavList({ groups, onNavigate }: { groups: ShellNavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  return (
    <nav className="space-y-5" aria-label="Admin">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{group.title}</p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = isActive(item, pathname, tab);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                      active ? "bg-white text-[#0A2B54] shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <span className="inline-flex min-w-0 items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.flag ? (
                      <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-[#0A2B54]">{item.flag}</span>
                    ) : null}
                    {item.badge ? (
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", active ? "bg-brand text-white" : "bg-white/15 text-white")}>
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/**
 * The page area. It fades each new page in, and while a link is loading it dims
 * the old page and shows a thin progress bar, so a click never looks like a flash.
 * (The public site's full-screen loader is disabled inside /admin.)
 */
function AdminContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname, search]);

  useEffect(() => {
    let timeout: number | undefined;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      try {
        const next = new URL(anchor.href, window.location.href);
        const here = new URL(window.location.href);
        if (next.origin !== here.origin || !next.pathname.startsWith("/admin")) return;
        if (next.pathname === here.pathname && next.search === here.search) return;
      } catch {
        return;
      }
      setPending(true);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setPending(false), 10_000);
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden transition-opacity duration-200",
          pending ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="admin-progress-bar h-full w-full bg-brand" />
      </div>
      <div
        key={`${pathname}?${search}`}
        className={cn("admin-fade-in transition-opacity duration-200", pending && "opacity-50")}
        aria-busy={pending}
      >
        {children}
      </div>
    </>
  );
}

function SignOutButton({ signOutAction }: { signOutAction: () => void | Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await signOutAction();
        } finally {
          // Full page load, so the signed-out screen replaces the shell cleanly.
          window.location.assign("/admin?notice=signed-out");
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-60"
    >
      {busy ? <Spinner size={12} /> : <LogOut className="h-3.5 w-3.5" aria-hidden="true" />}
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

function Sidebar({
  groups,
  user,
  signOutAction,
  onNavigate,
}: {
  groups: ShellNavGroup[];
  user: { name: string; email: string; role: AdminRole };
  signOutAction: () => void | Promise<void>;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-[linear-gradient(170deg,#06182E_0%,#0A2B54_60%,#0E3F78_100%)] text-white">
      <div className="px-5 pb-4 pt-6">
        <Image src="/logo-white.png" alt="Hayame" width={132} height={48} className="h-9 w-auto" priority unoptimized />
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Admin console</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <Suspense fallback={null}>
          <NavList groups={groups} onNavigate={onNavigate} />
        </Suspense>
      </div>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
            {user.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-white/60">{user.email}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <RoleBadge role={user.role} className="!bg-white/15 !text-white" />
          <SignOutButton signOutAction={signOutAction} />
        </div>
      </div>
    </div>
  );
}

export function AdminShell({
  groups,
  user,
  signOutAction,
  maintenance,
  children,
}: {
  groups: ShellNavGroup[];
  user: { name: string; email: string; role: AdminRole };
  signOutAction: () => void | Promise<void>;
  /** Set while maintenance mode is live, so admins never forget visitors are locked out. */
  maintenance?: { until: string | null } | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div data-admin-shell className="min-h-screen bg-[#F4F8FD] lg:pl-[272px] [&>*]:![animation:none]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] lg:block">
        <Sidebar groups={groups} user={user} signOutAction={signOutAction} />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/70 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Image src="/logo.png" alt="Hayame" width={110} height={40} className="h-7 w-auto" priority unoptimized />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-[#0A2B54]"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[290px] max-w-[85vw] shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close admin menu"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <Sidebar groups={groups} user={user} signOutAction={signOutAction} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {maintenance ? (
          <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <span className="flex min-w-0 items-start gap-2.5">
              <span className="relative mt-1.5 flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              </span>
              <span>
                <strong className="font-bold">Maintenance mode is ON.</strong> Visitors see the maintenance page{maintenance.until ? `, until ${maintenance.until}` : ", until you switch it off"}. You can still see the real site because you&apos;re signed in.
              </span>
            </span>
            <Link href="/admin/maintenance" className="shrink-0 rounded-lg bg-amber-900/10 px-3 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-900/20">
              Manage
            </Link>
          </div>
        ) : null}
        <Suspense fallback={null}>
          <AdminContent>{children}</AdminContent>
        </Suspense>
      </main>
    </div>
  );
}
