"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, ChartBar, Heart, Home, Star, User, WalletCards } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

type Host = {
  name: string;
  avatar: string;
};

const links = [
  { href: "/host", label: "Overview", icon: Home },
  { href: "/host/cars", label: "Vehicles", icon: Car },
  { href: "/host/bookings", label: "Bookings", icon: WalletCards },
  { href: "/host/favorites", label: "Favorites", icon: Heart },
  { href: "/host/earnings", label: "Earnings", icon: ChartBar },
  { href: "/host/reviews", label: "Reviews", icon: Star },
  { href: "/host/profile", label: "Host settings", icon: User },
];

export function DashboardSidebar({ host, pendingBookingCount = 0 }: { host: Host; pendingBookingCount?: number }) {
  const pathname = usePathname();
  const initials = getInitials(host.name);
  return (
    <aside className="hidden min-h-screen w-60 border-r border-border bg-white px-4 py-6 lg:block">
      <div className="text-lg font-semibold text-foreground">Host Dashboard</div>
      <Link
        href="/host/profile"
        className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-gray-50 px-3 py-2 transition hover:bg-brand/5"
      >
        {host.avatar ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border">
            <Image src={host.avatar} alt={host.name} fill className="object-cover" sizes="40px" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-primary/10 text-sm font-semibold text-primary">
            {initials || "H"}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">{host.name}</p>
          <p className="text-xs text-gray-600">Manage host settings</p>
        </div>
      </Link>
      <nav className="mt-6 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname?.startsWith(link.href);
          const showBookingDot = link.href === "/host/bookings" && pendingBookingCount > 0;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand/5",
                active && "bg-brand/10 text-brand",
              )}
            >
              <span className="relative inline-flex">
                <Icon className="h-4 w-4" />
                {showBookingDot ? (
                  <>
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand" />
                    <span className="sr-only">New booking requests</span>
                  </>
                ) : null}
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
