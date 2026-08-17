import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  CarFront,
  ChevronRight,
  Clock3,
  MapPinCheck,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { AppDownloadButtons } from "@/components/app-download-buttons";
import { FadeImage } from "@/components/ui/fade-image";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Download the Hayame App | iPhone & Android",
  description:
    "Download Hayame for iPhone or Android and book trusted cars across Ghana wherever you go.",
  alternates: { canonical: "/download" },
};

const IOS_SCREENS = [
  {
    src: "/download-app/ios-home.webp",
    alt: "Hayame iPhone home screen showing nearby cars in Ghana",
    label: "Find the right car",
  },
  {
    src: "/download-app/ios-car-detail.webp",
    alt: "Hayame iPhone car details screen",
    label: "See every detail",
  },
  {
    src: "/download-app/ios-trips.webp",
    alt: "Hayame iPhone trips screen",
    label: "Manage your trips",
  },
];

const ANDROID_SCREENS = [
  {
    src: "/download-app/android-home.webp",
    alt: "Hayame Android home screen showing cars near the renter",
    label: "Browse nearby cars",
  },
  {
    src: "/download-app/android-car-detail.webp",
    alt: "Hayame Android car detail and booking screen",
    label: "Book with confidence",
  },
  {
    src: "/download-app/android-sign-up.webp",
    alt: "Hayame Android account creation screen",
    label: "Get started quickly",
  },
];

const FEATURES = [
  {
    icon: MapPinCheck,
    title: "Cars close to you",
    body: "See trusted cars around Accra and beyond, with clear daily pricing.",
  },
  {
    icon: ShieldCheck,
    title: "Secure from start to finish",
    body: "Verified hosts, protected payments and booking details in one place.",
  },
  {
    icon: MessageCircle,
    title: "Hosts one message away",
    body: "Keep pickup questions and trip conversations together in the app.",
  },
  {
    icon: Clock3,
    title: "Made for moving",
    body: "Save favourites, book in minutes and check every trip on the go.",
  },
];

function PhoneScreenshot({
  screen,
  platform,
  priority = false,
}: {
  screen: (typeof IOS_SCREENS)[number];
  platform: "iOS" | "Android";
  priority?: boolean;
}) {
  const isIos = platform === "iOS";

  return (
    <figure className="w-[68vw] max-w-[258px] shrink-0 snap-center sm:w-auto sm:max-w-none">
      <div className="overflow-hidden rounded-[2rem] border-[5px] border-[#071c30] bg-[#071c30] shadow-[0_26px_70px_rgba(6,34,58,0.18)] sm:rounded-[2.35rem] sm:border-[7px]">
        <FadeImage
          src={screen.src}
          alt={screen.alt}
          width={isIos ? 828 : 744}
          height={isIos ? 1801 : 1654}
          sizes="(max-width: 639px) 68vw, (max-width: 1023px) 28vw, 240px"
          priority={priority}
          className="h-auto w-full rounded-[1.55rem] sm:rounded-[1.8rem]"
        />
      </div>
      <figcaption className="mt-4 text-center text-sm font-semibold text-[#0b3157]">
        {screen.label}
      </figcaption>
    </figure>
  );
}

function ScreenshotCollection({
  title,
  eyebrow,
  description,
  screens,
  platform,
}: {
  title: string;
  eyebrow: string;
  description: string;
  screens: typeof IOS_SCREENS;
  platform: "iOS" | "Android";
}) {
  return (
    <section className="rounded-[2rem] border border-sky-100 bg-white p-5 shadow-[0_24px_80px_rgba(14,134,212,0.08)] sm:p-8 lg:p-10">
      <Reveal>
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] !text-brand">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#06223a] sm:text-3xl">
            {title}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        </div>
        <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:gap-7">
          {screens.map((screen) => (
            <PhoneScreenshot
              key={screen.src}
              screen={screen}
              platform={platform}
            />
          ))}
        </div>
      </Reveal>
    </section>
  );
}

export default function DownloadPage() {
  return (
    <div className="overflow-hidden bg-[#f6f9fc]">
      <section className="brand-panel relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="brand-dots pointer-events-none absolute inset-0 -z-10"
        />
        <div
          aria-hidden="true"
          className="brand-streaks pointer-events-none absolute inset-0 -z-10 opacity-60"
        />
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-16 -z-10 h-80 w-80 rounded-full bg-sky-300/25 blur-3xl sm:h-[30rem] sm:w-[30rem]"
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-14 sm:py-20 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:py-24">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold !text-white backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              Hayame for iPhone and Android
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.04] tracking-[-0.04em] !text-white sm:text-5xl lg:text-6xl">
              Your next car is already in your pocket.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 !text-white/70 sm:text-lg">
              Browse cars near you, compare transparent prices, book securely
              and manage every trip from the Hayame app.
            </p>

            <AppDownloadButtons className="mt-8" />

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium !text-white/65 sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                Verified local hosts
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Secure payments
              </span>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[510px] items-end justify-center pt-4 lg:pt-0">
            <div
              aria-hidden="true"
              className="absolute bottom-8 left-1/2 h-40 w-[90%] -translate-x-1/2 rounded-full bg-black/30 blur-3xl"
            />
            <div className="relative z-10 w-[44%] -rotate-[5deg] translate-x-3">
              <div className="overflow-hidden rounded-[1.75rem] border-[5px] border-[#071c30] bg-[#071c30] shadow-2xl sm:rounded-[2.25rem] sm:border-[7px]">
                <Image
                  src="/download-app/ios-home.webp"
                  alt="Hayame running on iPhone"
                  width={828}
                  height={1801}
                  priority
                  sizes="(max-width: 1023px) 40vw, 220px"
                  className="h-auto w-full rounded-[1.35rem] sm:rounded-[1.7rem]"
                />
              </div>
              <span className="absolute -left-3 top-10 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#06223a] shadow-lg sm:text-xs">
                iPhone
              </span>
            </div>
            <div className="relative z-20 w-[44%] rotate-[5deg] -translate-x-3 translate-y-6">
              <div className="overflow-hidden rounded-[1.75rem] border-[5px] border-[#071c30] bg-[#071c30] shadow-2xl sm:rounded-[2.25rem] sm:border-[7px]">
                <Image
                  src="/download-app/android-home.webp"
                  alt="Hayame running on Android"
                  width={744}
                  height={1654}
                  priority
                  sizes="(max-width: 1023px) 40vw, 220px"
                  className="h-auto w-full rounded-[1.35rem] sm:rounded-[1.7rem]"
                />
              </div>
              <span className="absolute -right-3 top-16 rounded-full bg-brand px-3 py-1 text-[11px] font-bold text-white shadow-lg sm:text-xs">
                Android
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] !text-brand">
              Everything travels with you
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#06223a] sm:text-4xl">
              From searching to pickup, all in one app.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-brand">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-base font-bold text-[#06223a]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {feature.body}
                  </p>
                </article>
              );
            })}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl space-y-7 px-6 pb-16 sm:space-y-10 sm:pb-24">
        <ScreenshotCollection
          eyebrow="Designed for iPhone"
          title="A polished experience that feels at home on iOS."
          description="Move naturally from discovery to booking, then keep every upcoming and past trip within reach."
          screens={IOS_SCREENS}
          platform="iOS"
        />
        <ScreenshotCollection
          eyebrow="Built for Android"
          title="The same Hayame experience, made native for Android."
          description="Browse nearby cars, open rich listing details and create your account through a fast, familiar Android flow."
          screens={ANDROID_SCREENS}
          platform="Android"
        />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16 sm:pb-24">
        <Reveal className="grid overflow-hidden rounded-[2rem] bg-[#06223a] lg:grid-cols-[0.92fr_1.08fr]">
          <div className="border-b border-white/10 p-6 sm:p-10 lg:border-b-0 lg:border-r">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white">
              <Smartphone className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-6 text-2xl font-bold !text-white sm:text-3xl">
              Installing the Android beta
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 !text-white/65 sm:text-base">
              The Android app downloads directly as a 50 MB APK. Your phone may
              ask you to allow installs from your browser before opening it.
            </p>
          </div>
          <div className="p-6 sm:p-10">
            <ol className="space-y-5">
              {[
                "Tap Download Android app and keep the APK when prompted.",
                "Open the download, then approve installation from this source if Android asks.",
                "Launch Hayame, sign in and start browsing cars near you.",
              ].map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#06223a]">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-6 !text-white/75">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-7 rounded-2xl border border-amber-200/20 bg-amber-100/10 p-4 text-xs leading-5 !text-amber-50">
              For your safety, only install the Hayame APK downloaded from
              hayamegh.com.
            </div>
          </div>
        </Reveal>
      </section>

      <section className="border-t border-sky-100 bg-white">
        <Reveal className="mx-auto flex max-w-6xl flex-col gap-7 px-6 py-14 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand">
              <CarFront className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">
                Ready when you are
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-bold text-[#06223a] sm:text-3xl">
              Find a car for your next move.
            </h2>
            <Link
              href="/explore"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand"
            >
              Browse on the web
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <AppDownloadButtons tone="light" className="shrink-0" />
        </Reveal>
      </section>
    </div>
  );
}
