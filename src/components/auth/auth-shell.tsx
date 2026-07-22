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
 * Left: brand panel — gradient built from brand tokens, layered with a dot grid
 * and diagonal streaks that echo the motion lines in the Hayame mark, plus two
 * slowly drifting orbs. Right: the form, vertically centred.
 *
 * Below `lg` the panel becomes a compact header so the form is the first thing
 * in view on a phone, which is where most Hayame signups happen.
 *
 * Every piece of text on the dark panel sets its own colour class: the global
 * `h1..h4 { color: #0b1220 }` and `p { color: #42526e }` rules in globals.css
 * are element selectors and would otherwise win over inherited white.
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
      {/* On phones this collapses to a compact header — logo and headline only.
          Showing the full feature list there would push the form below the
          fold, and phones are where most Hayame signups happen. */}
      <aside className="auth-panel relative isolate overflow-hidden px-6 py-7 sm:px-10 lg:w-[46%] lg:max-w-[640px] lg:px-12 lg:py-14">
        {/* Texture layers */}
        <div aria-hidden className="auth-dots pointer-events-none absolute inset-0 -z-10" />
        <div
          aria-hidden
          className="auth-streaks pointer-events-none absolute inset-0 -z-10 opacity-70"
        />

        {/* Ambient drifting light */}
        <div
          aria-hidden
          className="auth-orb pointer-events-none absolute -right-32 -top-32 -z-10 h-[26rem] w-[26rem] rounded-full bg-brand/25 blur-3xl"
        />
        <div
          aria-hidden
          className="auth-orb-alt pointer-events-none absolute -bottom-40 -left-24 -z-10 h-[24rem] w-[24rem] rounded-full bg-sky-400/15 blur-3xl"
        />

        {/* Slow sheen sweep */}
        <div
          aria-hidden
          className="auth-sheen pointer-events-none absolute inset-y-0 -z-10 w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
        />

        <div className="relative flex h-full flex-col">
          <Link
            href="/"
            className="auth-rise inline-flex w-fit items-center gap-2 rounded-lg text-sm font-medium !text-white/70 transition-colors hover:!text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>

          <div
            className="auth-rise mt-6 lg:mt-16"
            style={{ animationDelay: "80ms" }}
          >
            <Image
              src="/logo-white.png"
              alt="Hayame"
              width={1808}
              height={944}
              priority
              className="h-10 w-auto object-contain lg:h-16"
            />
          </div>

          <h1
            className="auth-rise mt-5 text-2xl font-bold leading-[1.15] tracking-tight !text-white sm:text-3xl lg:mt-8 lg:text-[2.7rem]"
            style={{ animationDelay: "160ms" }}
          >
            Ghana&apos;s trusted
            <br />
            car sharing network.
          </h1>
          <p
            className="auth-rise mt-3 hidden max-w-md text-sm leading-relaxed !text-white/70 sm:block sm:text-base lg:mt-4"
            style={{ animationDelay: "220ms" }}
          >
            Rent a car from a verified local host, or earn from the one sitting
            in your driveway.
          </p>

          <ul className="hidden lg:mt-14 lg:block lg:space-y-6">
            {FEATURES.map((feature, index) => (
              <li
                key={feature.title}
                className="auth-rise flex gap-4"
                style={{ animationDelay: `${300 + index * 90}ms` }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm">
                  <feature.icon className="h-5 w-5 text-white" />
                </span>
                <span className="pt-0.5">
                  <span className="block text-sm font-semibold text-white">
                    {feature.title}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-white/60">
                    {feature.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#f6f9fc] px-5 py-10 sm:px-8 lg:py-16">
        {/* Faint brand wash so the two halves feel like one page. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-1/4 h-[30rem] w-[30rem] rounded-full bg-brand/[0.06] blur-3xl"
        />

        <div className="relative w-full max-w-[440px]">
          <div
            role="tablist"
            aria-label="Sign in or create an account"
            className="auth-rise mb-7 grid grid-cols-2 rounded-xl border border-border bg-white p-1 shadow-sm"
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
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active === tab.key
                    ? "bg-brand text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-brand"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="auth-rise" style={{ animationDelay: "90ms" }}>
            {children}
          </div>

          <p
            className="auth-rise mt-7 text-center text-xs leading-relaxed text-gray-500"
            style={{ animationDelay: "160ms" }}
          >
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
