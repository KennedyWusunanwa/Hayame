"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Car,
  ClipboardCheck,
  Construction,
  FileClock,
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
  X,
  type LucideIcon,
} from "lucide-react";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import { RoleBadge } from "@/components/admin/admin-ui";
import type { AdminRole } from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  applications: ClipboardCheck,
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

export type ShellNavItem = { label: string; href: string; icon: keyof typeof ICONS; badge?: number };
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
          <form action={signOutAction}>
            <PendingSubmitButton
              pendingLabel="Signing out…"
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
            >
              <span className="inline-flex items-center gap-1.5">
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </span>
            </PendingSubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({
  groups,
  user,
  signOutAction,
  children,
}: {
  groups: ShellNavGroup[];
  user: { name: string; email: string; role: AdminRole };
  signOutAction: () => void | Promise<void>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#F4F8FD] lg:pl-[272px]">
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

      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
