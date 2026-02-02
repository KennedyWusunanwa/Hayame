"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, User, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/bookings", label: "Bookings", icon: WalletCards },
  { href: "/dashboard/favorites", label: "Favorites", icon: Heart },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function UserDashboardMobileNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-20 -mx-4 bg-white/95 px-4 py-2 shadow-sm backdrop-blur lg:hidden">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Dashboard</p>
        <span className="text-xs text-gray-500">Quick nav</span>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-shrink-0 items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium text-gray-700",
                active && "border-primary bg-primary/10 text-primary",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
