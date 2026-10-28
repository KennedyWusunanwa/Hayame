"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, PlusCircle } from "lucide-react";
import { useMessaging } from "@/components/messages/messaging-provider";
import { HOST_NAV, isHostLinkActive } from "@/components/dashboard/sidebar";
import { cn } from "@/lib/utils";

/**
 * Phone and tablet host navigation: a sticky, horizontally scrollable row of
 * pills with the same sections as the desktop sidebar, plus chats and a
 * shortcut to create a listing. Snaps so the active pill is always reachable
 * with a single thumb flick.
 */
export function DashboardMobileNav({
  pendingBookingCount = 0,
}: {
  pendingBookingCount?: number;
}) {
  const pathname = usePathname();
  const { unreadCount } = useMessaging();
  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);
  const bookingCountLabel =
    pendingBookingCount > 99 ? "99+" : String(pendingBookingCount);

  return (
    <nav
      aria-label="Host sections"
      className="sticky top-0 z-20 -mx-4 bg-[#f6f9fc]/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden"
    >
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {HOST_NAV.map((item) => {
          const Icon = item.icon;
          const active = isHostLinkActive(pathname, item);
          const badge =
            item.href === "/host/bookings" && pendingBookingCount > 0
              ? bookingCountLabel
              : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 snap-start items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors",
                active
                  ? "border-brand bg-brand !text-white shadow-[0_10px_24px_rgba(14,134,212,0.28)]"
                  : "border-sky-100 bg-white !text-slate-600 hover:border-brand/40 hover:!text-brand",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {badge ? (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                    active ? "bg-white !text-brand" : "bg-brand !text-white",
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
        <Link
          href="/messages"
          className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-sky-100 bg-white px-3.5 py-2 text-[13px] font-semibold !text-slate-600 hover:border-brand/40 hover:!text-brand"
        >
          <MessageCircle className="h-4 w-4" />
          Chats
          {unreadCount > 0 ? (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold !text-white">
              {unreadLabel}
            </span>
          ) : null}
        </Link>
        <Link
          href="/host/cars/new"
          className="flex shrink-0 snap-start items-center gap-1.5 rounded-full border border-dashed border-brand/40 bg-sky-50 px-3.5 py-2 text-[13px] font-semibold !text-brand"
        >
          <PlusCircle className="h-4 w-4" />
          New listing
        </Link>
      </div>
    </nav>
  );
}
