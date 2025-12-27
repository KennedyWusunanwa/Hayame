"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, ChartBar, Home, Star, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/cars", label: "My Cars", icon: Car },
  { href: "/dashboard/bookings", label: "Bookings", icon: WalletCards },
  { href: "/dashboard/earnings", label: "Earnings", icon: ChartBar },
  { href: "/dashboard/reviews", label: "Reviews", icon: Star },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden min-h-screen w-60 border-r border-border bg-white px-4 py-6 lg:block">
      <div className="text-lg font-semibold text-foreground">Host Dashboard</div>
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
