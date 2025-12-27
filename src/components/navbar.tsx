"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/prices", label: "Prices" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const isActive = (href: string) => (pathname || "/").replace(/\/$/, "") === href.replace(/\/$/, "");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const loadUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
          setUserName(null);
          return;
        }
        const name = (user.user_metadata as any)?.full_name || user.email || "Account";
        setUserName(name);
      } catch (error) {
        setUserName(null);
      }
    };
    loadUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (!user) {
        setUserName(null);
      } else {
        const name = (user.user_metadata as any)?.full_name || user.email || "Account";
        setUserName(name);
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

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
              <Button
                asChild
                className="bg-brand text-white hover:bg-white hover:text-brand hover:border-brand rounded-full px-5"
              >
                <Link href="/dashboard/cars/new">List your car</Link>
              </Button>
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
              <Button variant="ghost" asChild className="text-gray-800 hover:text-brand">
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button variant="outline" asChild className="hidden sm:inline-flex border-brand text-brand">
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-3 text-sm font-medium text-gray-800">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={`rounded-md px-2 py-2 transition-colors hover:text-brand ${
                        isActive(link.href) ? "text-brand" : "text-gray-800"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                {userName ? (
                  <div className="rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800">
                    {userName}
                  </div>
                ) : null}
                {!userName ? (
                  <>
                    <SheetClose asChild>
                      <Link href="/auth/login" className="rounded-md px-2 py-2 text-gray-800 hover:text-brand">
                        Log in
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild className="bg-brand text-white hover:bg-[#0c78bb] w-full">
                        <Link href="/auth/signup">Sign up</Link>
                      </Button>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="border-brand text-brand w-full">
                        <Link href="/dashboard/cars/new">List your car</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        className="w-full border-brand text-brand"
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
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
