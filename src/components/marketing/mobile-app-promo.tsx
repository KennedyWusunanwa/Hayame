import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { AppDownloadButtons } from "@/components/app-download-buttons";
import { FadeImage } from "@/components/ui/fade-image";
import { Reveal } from "@/components/ui/reveal";

export function MobileAppPromo() {
  return (
    <section className="relative isolate overflow-hidden border-y border-sky-100 bg-[radial-gradient(circle_at_12%_15%,rgba(125,211,252,0.34),transparent_29%),radial-gradient(circle_at_88%_82%,rgba(14,134,212,0.14),transparent_32%),linear-gradient(135deg,#eff8ff_0%,#f8fbff_48%,#e8f5ff_100%)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 bottom-0 -z-10 h-80 w-80 rounded-full bg-white/90 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-sky-300/25 blur-3xl"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 sm:py-[4.5rem] lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-20">
        <Reveal
          delay={80}
          className="relative mx-auto flex w-full max-w-[430px] items-end justify-center pt-2 lg:order-2"
        >
          <div
            aria-hidden="true"
            className="absolute bottom-1 left-1/2 h-24 w-[78%] -translate-x-1/2 rounded-full bg-sky-950/20 blur-3xl"
          />
          <div className="relative z-10 w-[42%] -rotate-[5deg] translate-x-4">
            <div className="overflow-hidden rounded-[1.7rem] border-[5px] border-[#031628] bg-[#031628] shadow-2xl sm:rounded-[2rem]">
              <FadeImage
                src="/download-app/ios-car-detail.webp"
                alt="Hayame car details on iPhone"
                width={828}
                height={1801}
                sizes="(max-width: 639px) 42vw, (max-width: 1023px) 220px, 190px"
                className="h-auto w-full rounded-[1.35rem]"
              />
            </div>
            <span className="absolute -left-3 top-12 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#06223a] shadow-lg sm:text-xs">
              iPhone
            </span>
          </div>
          <div className="relative z-20 w-[42%] rotate-[5deg] -translate-x-4 translate-y-5">
            <div className="overflow-hidden rounded-[1.7rem] border-[5px] border-[#031628] bg-[#031628] shadow-2xl sm:rounded-[2rem]">
              <FadeImage
                src="/download-app/android-home.webp"
                alt="Hayame nearby cars on Android"
                width={744}
                height={1654}
                sizes="(max-width: 639px) 42vw, (max-width: 1023px) 220px, 190px"
                className="h-auto w-full rounded-[1.35rem]"
              />
            </div>
            <span className="absolute -right-3 top-16 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-white shadow-lg sm:text-xs">
              Android
            </span>
          </div>
        </Reveal>

        <Reveal className="lg:order-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1.5 text-xs font-semibold !text-brand shadow-sm shadow-sky-950/5">
            <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
            Hayame, wherever you are
          </span>
          <h2 className="mt-5 max-w-xl text-3xl font-bold leading-tight tracking-tight !text-[#06223a] sm:text-4xl">
            Take Hayame with you.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 !text-slate-600 sm:text-base sm:leading-7">
            Find nearby cars, book securely and keep every trip at your
            fingertips on iPhone or Android.
          </p>
          <AppDownloadButtons tone="light" className="mt-7" />
          <Link
            href="/download"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold !text-brand hover:!text-[#06223a]"
          >
            See the app experience
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
