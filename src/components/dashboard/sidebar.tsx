"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Car,
  ChartBar,
  Heart,
  Home,
  PlusCircle,
  Settings,
  Star,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

type Host = {
  name: string;
  avatar: string;
};

export type HostNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const HOST_NAV: HostNavItem[] = [
  { href: "/host", label: "Overview", icon: Home, exact: true },
  { href: "/host/cars", label: "Vehicles", icon: Car },
  { href: "/host/bookings", label: "Bookings", icon: WalletCards },
  { href: "/host/earnings", label: "Earnings", icon: ChartBar },
  { href: "/host/reviews", label: "Reviews", icon: Star },
  { href: "/host/favorites", label: "Guest saves", icon: Heart },
  { href: "/host/profile", label: "Host settings", icon: Settings },
];

export function isHostLinkActive(pathname: string | null, item: HostNavItem) {
  if (!pathname) return false;
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/**
 * Desktop host navigation: a sticky column with the host card on the brand
 * surface, the section links, and the primary "new listing" action. Hidden
 * below `lg`, where `DashboardMobileNav` takes over.
 */
export function DashboardSidebar({
  host,
  pendingBookingCount = 0,
}: {
  host: Host;
  pendingBookingCount?: number;
}) {
  const pathname = usePathname();
  const initials = getInitials(host.name);
  const bookingCountLabel =
    pendingBookingCount > 99 ? "99+" : String(pendingBookingCount);

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-24 space-y-4">
        <Link
          href="/host/profile"
          className="brand-panel group relative isolate block overflow-hidden rounded-[1.5rem] p-5 shadow-[0_20px_60px_rgba(6,34,58,0.18)] transition-transform hover:-translate-y-0.5"
        >
          <div
            aria-hidden
            className="brand-dots pointer-events-none absolute inset-0 -z-10"
          />
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/20 p-[3px]">
              {host.avatar ? (
                <div className="relative h-12 w-12 overflow-hidden rounded-full">
                  <Image
                    src={host.avatar}
                    alt={host.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-sm font-bold !text-white">
                  {initials || "H"}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold !text-white">{host.name}</p>
              <p className="text-xs !text-white/65">Hayame host</p>
            </div>
          </div>
          <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold !text-sky-200 transition-colors group-hover:!text-white">
            Manage host settings
          </p>
        </Link>

        <nav className="rounded-[1.5rem] border border-sky-100 bg-white p-2 shadow-[0_18px_50px_rgba(14,134,212,0.06)]">
          {HOST_NAV.map((item) => {
            const Icon = item.icon;
            const active = isHostLinkActive(pathname, item);
            const showBookingBadge =
              item.href === "/host/bookings" && pendingBookingCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold !text-slate-600 transition-colors hover:bg-sky-50 hover:!text-[#06223a]",
                  active && "bg-brand/10 !text-brand hover:bg-brand/10 hover:!text-brand",
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand"
                  />
                ) : null}
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-white group-hover:text-brand",
                    active && "bg-white text-brand",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate">{item.label}</span>
                {showBookingBadge ? (
                  <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold !text-white">
                    {bookingCountLabel}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/host/cars/new"
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold !text-white shadow-[0_12px_30px_rgba(14,134,212,0.28)] transition-transform hover:-translate-y-0.5"
        >
          <PlusCircle className="h-4 w-4" />
          New listing
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold !text-slate-500 hover:!text-brand"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to browsing
        </Link>
      </div>
    </aside>
  );
}
