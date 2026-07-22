"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CarFront,
  MapPin,
  ShieldCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: CarFront,
    title: "Rent in minutes",
    body: "Browse verified cars near you and book without the back-and-forth.",
  },
  {
    icon: ShieldCheck,
    title: "Protected bookings",
    body: "Secure payments through Paystack, with clear cancellation policies.",
  },
  {
    icon: BadgeCheck,
    title: "Verified hosts",
    body: "Every host and listing is reviewed before it goes live on Hayame.",
  },
  {
    icon: MapPin,
    title: "Built for Ghana",
    body: "From Accra to Kumasi — local pricing, local support, local roads.",
  },
];

/**
 * Split-screen shell for sign in / sign up.
 *
 * Left: brand panel, fixed and non-scrolling on desktop. Right: the form,
 * vertically centred and independently scrollable so a long signup form never
 * pushes the layout around.
 *
 * Below `lg` the brand panel collapses to a compact header so the form is the
 * first thing in view on a phone — which is where most Hayame signups happen.
 */
export function AuthShell({
  active,
  children,
}: {
  active: "login" | "signup";
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel */}
      <aside className="relative overflow-hidden bg-[#0b2b45] px-6 py-8 text-white sm:px-10 lg:w-[46%] lg:max-w-[620px] lg:px-12 lg:py-12">
        {/* Oversized watermark, clipped by the panel. Hidden on small screens
            where it would sit behind the form copy. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 hidden select-none text-[22rem] font-black leading-none text-white/[0.04] lg:block"
        >
          H
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl"
        />

        <div className="relative flex h-full flex-col">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>

          <div className="mt-8 lg:mt-14">
            <Image
              src="/logo.png"
              alt="Hayame"
              width={148}
              height={148}
              priority
              className="h-14 w-auto object-contain lg:h-20"
            />
          </div>

          <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:mt-8 lg:text-[2.75rem]">
            Welcome to
            <br />
            Hayame
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
            Ghana&apos;s trusted car sharing network — rent a car from a
            verified local host, or earn from the one sitting in your driveway.
          </p>

          <ul className="mt-8 space-y-5 lg:mt-12 lg:space-y-6">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <feature.icon className="h-5 w-5 text-white" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">
                    {feature.title}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-white/60">
                    {feature.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 items-center justify-center bg-[#f7f9fb] px-5 py-10 sm:px-8 lg:py-16">
        <div className="w-full max-w-[440px]">
          <div
            role="tablist"
            aria-label="Sign in or create an account"
            className="mb-8 grid grid-cols-2 rounded-xl border border-border bg-white p-1 shadow-sm"
          >
            {(
              [
                { key: "login", label: "Sign In", href: "/auth/login" },
                { key: "signup", label: "Create Account", href: "/auth/signup" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                role="tab"
                type="button"
                aria-selected={active === tab.key}
                onClick={() => router.push(tab.href)}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active === tab.key
                    ? "bg-brand text-white shadow-sm"
                    : "text-gray-600 hover:text-brand"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {children}

          <p className="mt-8 text-center text-xs leading-relaxed text-gray-500">
            By continuing, you agree to our{" "}
            <Link
              href="/privacy"
              className="font-medium text-brand hover:underline"
            >
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link
              href="/protection"
              className="font-medium text-brand hover:underline"
            >
              Protection Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
