"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Home, User, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/host", label: "Overview", icon: Home },
  { href: "/host/cars", label: "Vehicles", icon: Car },
  { href: "/host/bookings", label: "Bookings", icon: WalletCards },
  { href: "/host/profile", label: "Settings", icon: User },
];

export function DashboardMobileNav({ pendingBookingCount = 0 }: { pendingBookingCount?: number }) {
  const pathname = usePathname();
  const bookingCountLabel = pendingBookingCount > 99 ? "99+" : String(pendingBookingCount);
  return (
    <nav className="sticky top-0 z-20 -mx-4 bg-white/95 px-4 py-2 shadow-sm backdrop-blur lg:hidden">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Host dashboard</p>
        <span className="text-xs text-gray-500">Quick nav</span>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname?.startsWith(link.href);
          const showBookingDot = link.href === "/host/bookings" && pendingBookingCount > 0;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-shrink-0 items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium text-gray-700",
                active && "border-primary bg-primary/10 text-primary",
              )}
            >
              <span className="relative inline-flex">
                <Icon className="h-4 w-4" />
                {showBookingDot ? (
                  <>
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-white" />
                    <span className="sr-only">New booking requests</span>
                  </>
                ) : null}
              </span>
              {link.label}
              {showBookingDot ? (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
                  {bookingCountLabel}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
