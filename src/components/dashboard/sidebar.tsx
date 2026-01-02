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
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/cars", label: "My Cars", icon: Car },
  { href: "/dashboard/bookings", label: "Bookings", icon: WalletCards },
  { href: "/dashboard/favorites", label: "Favorites", icon: Heart },
  { href: "/dashboard/earnings", label: "Earnings", icon: ChartBar },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function DashboardSidebar({ host }: { host: Host }) {
  const pathname = usePathname();
  const initials = getInitials(host.name);
  return (
    <aside className="hidden min-h-screen w-60 border-r border-border bg-white px-4 py-6 lg:block">
      <div className="text-lg font-semibold text-foreground">Host Dashboard</div>
      <Link
        href="/dashboard/profile"
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
          <p className="text-xs text-gray-600">Manage profile</p>
        </div>
      </Link>
      <nav className="mt-6 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand/5",
                active && "bg-brand/10 text-brand",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
