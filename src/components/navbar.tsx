"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { siteFlags } from "@/lib/site-flags";
import { useMessaging } from "@/components/messages/messaging-provider";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/prices", label: "Prices", enabled: siteFlags.marketing.pricesPage },
  { href: "/blog", label: "Blog", enabled: siteFlags.marketing.blogPage },
  { href: "/contact", label: "Contact" },
].filter((link) => link.enabled ?? true);

export function Navbar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    (pathname || "/").replace(/\/$/, "") === href.replace(/\/$/, "");
  const [userName, setUserName] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [hostStatus, setHostStatus] = useState<
    "pending" | "approved" | "rejected" | null
  >(null);
  const [hostBookingAlertCount, setHostBookingAlertCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unreadCount } = useMessaging();

  const supabaseRef = useRef<ReturnType<
    typeof createSupabaseBrowserClient
  > | null>(null);

  const loadUser = useCallback(async () => {
    try {
      const supabase = supabaseRef.current ?? createSupabaseBrowserClient();
      supabaseRef.current = supabase;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setUserName(null);
        setIsHost(false);
        setHostStatus(null);
        setHostBookingAlertCount(0);
        return;
      }
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const profileName = String(
        (profile as { full_name?: string | null } | null)?.full_name ?? "",
      ).trim();
      const metadataName = String(
        (user.user_metadata as any)?.full_name ?? "",
      ).trim();
      const username = String(
        (user.user_metadata as any)?.username ?? "",
      ).trim();
      const fallbackName = user.email || "Account";
      setUserName(username || profileName || metadataName || fallbackName);
      const res = await fetch("/api/host-status", { cache: "no-store" });
      if (res.ok) {
        const payload = (await res.json()) as {
          is_host?: boolean;
          status?: string | null;
        };
        const approvedHost = Boolean(payload.is_host);
        setIsHost(approvedHost);
        setHostStatus(
          approvedHost ? "approved" : ((payload.status as any) ?? null),
        );
        if (approvedHost) {
          const bookingsRes = await fetch("/api/bookings", {
            cache: "no-store",
          });
          if (bookingsRes.ok) {
            const bookingsPayload = (await bookingsRes.json()) as {
              data?: Array<{
                role?: string;
                status?: string | null;
                payment_status?: string | null;
              }>;
            };
            const ownerAlerts = (bookingsPayload.data ?? []).filter(
              (booking) => {
                const role = String(booking.role ?? "");
                const status = String(booking.status ?? "");
                const paymentStatus = String(booking.payment_status ?? "");
                const isOwnerBooking = role.includes("owner");
                return (
                  isOwnerBooking &&
                  status === "awaiting_host" &&
                  paymentStatus === "paid"
                );
              },
            ).length;
            setHostBookingAlertCount(ownerAlerts);
          } else {
            setHostBookingAlertCount(0);
          }
        } else {
          setHostBookingAlertCount(0);
        }
      } else {
        setIsHost(false);
        setHostStatus(null);
        setHostBookingAlertCount(0);
      }
    } catch {
      setUserName(null);
      setIsHost(false);
      setHostStatus(null);
      setHostBookingAlertCount(0);
    }
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabaseRef.current = supabase;
    loadUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [loadUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser, pathname]);

  useEffect(() => {
    const onBookingsUpdated = () => {
      loadUser();
    };
    window.addEventListener("bookings:updated", onBookingsUpdated);
    return () => {
      window.removeEventListener("bookings:updated", onBookingsUpdated);
    };
  }, [loadUser]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3" aria-label="Hayame">
          <Image
            src="/logo.png"
            alt="Hayame"
            width={400}
            height={140}
            priority
            className="h-16 w-auto object-contain"
          />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-800 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-2 py-1 transition-colors hover:text-brand ${
                isActive(link.href) ? "text-brand" : "text-gray-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {userName ? (
            <>
              <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
                {userName}
              </div>
              <Link
                href="/messages"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border text-gray-700 hover:text-brand"
                aria-label="Messages"
              >
                <MessageCircle className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </Link>
              {isHost ? (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="border-brand text-brand"
                  >
                    <Link
                      href="/host"
                      className="inline-flex items-center gap-2"
                    >
                      <span>Host dashboard</span>
                      {hostBookingAlertCount > 0 ? (
                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
                          {hostBookingAlertCount > 99
                            ? "99+"
                            : hostBookingAlertCount}
                        </span>
                      ) : null}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-brand text-white hover:bg-white hover:text-brand hover:border-brand rounded-full px-5"
                  >
                    <Link href="/host/cars/new">List Your Car &amp; Earn</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="border-brand text-brand"
                  >
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-brand text-white hover:bg-white hover:text-brand hover:border-brand"
                  >
                    <Link href="/become-host">
                      {hostStatus === "pending"
                        ? "Application pending"
                        : "Become a Host"}
                    </Link>
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                className="border-brand text-brand"
                onClick={async () => {
                  const supabase = createSupabaseBrowserClient();
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                asChild
                className="text-gray-800 hover:text-brand"
              >
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="hidden sm:inline-flex border-brand text-brand"
              >
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 md:hidden">
          {userName ? (
            <Link
              href="/messages"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border text-gray-700 hover:text-brand"
              aria-label="Messages"
            >
              <MessageCircle className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
          ) : null}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-900">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full max-w-xs bg-white text-gray-900"
            >
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-gray-800">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-md px-2 py-2 transition-colors hover:text-brand ${
                        isActive(link.href) ? "text-brand" : "text-gray-800"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                {userName ? (
                  <div className="flex flex-col gap-2">
                    <div className="rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800">
                      {userName}
                    </div>
                    <SheetClose asChild>
                      <Link
                        href="/messages"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm text-gray-700"
                      >
                        <span className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          Messages
                        </span>
                        {unreadCount > 0 ? (
                          <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        ) : null}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      {isHost ? (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full border-brand text-brand hover:bg-brand hover:text-white"
                        >
                          <Link
                            href="/host"
                            className="inline-flex items-center gap-2"
                          >
                            <span>Host dashboard</span>
                            {hostBookingAlertCount > 0 ? (
                              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
                                {hostBookingAlertCount > 99
                                  ? "99+"
                                  : hostBookingAlertCount}
                              </span>
                            ) : null}
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full border-brand text-brand hover:bg-brand hover:text-white"
                        >
                          <Link href="/dashboard">Dashboard</Link>
                        </Button>
                      )}
                    </SheetClose>
                    <SheetClose asChild>
                      {isHost ? (
                        <Button
                          asChild
                          className="w-full bg-brand text-white hover:bg-white hover:text-brand hover:border-brand"
                        >
                          <Link href="/host/cars/new">
                            List Your Car &amp; Earn
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          asChild
                          className="w-full bg-brand text-white hover:bg-white hover:text-brand hover:border-brand"
                        >
                          <Link href="/become-host">
                            {hostStatus === "pending"
                              ? "Application pending"
                              : "Become a Host"}
                          </Link>
                        </Button>
                      )}
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        className="w-full border-brand text-brand hover:bg-brand hover:text-white"
                        variant="outline"
                        onClick={async () => {
                          const supabase = createSupabaseBrowserClient();
                          await supabase.auth.signOut();
                          window.location.href = "/";
                        }}
                      >
                        Sign out
                      </Button>
                    </SheetClose>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <SheetClose asChild>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-brand text-brand hover:bg-brand hover:text-white"
                      >
                        <Link href="/auth/login">Log in</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        asChild
                        className="w-full bg-brand text-white hover:bg-white hover:text-brand hover:border-brand"
                      >
                        <Link href="/auth/signup">Sign up</Link>
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
