"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, User, WalletCards } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

type UserProfile = {
  name: string;
  avatar: string;
};

const links = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/bookings", label: "Bookings", icon: WalletCards },
  { href: "/dashboard/favorites", label: "Favorites", icon: Heart },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function UserDashboardSidebar({ user }: { user: UserProfile }) {
  const pathname = usePathname();
  const initials = getInitials(user.name);
  return (
    <aside className="hidden min-h-screen w-60 border-r border-border bg-white px-4 py-6 lg:block">
      <div className="text-lg font-semibold text-foreground">Dashboard</div>
      <Link
        href="/dashboard/profile"
        className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-gray-50 px-3 py-2 transition hover:bg-brand/5"
      >
        {user.avatar ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border">
            <Image src={user.avatar} alt={user.name} fill className="object-cover" sizes="40px" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-primary/10 text-sm font-semibold text-primary">
            {initials || "U"}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">{user.name}</p>
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
