import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mail, MapPin, ShieldCheck } from "lucide-react";
import { siteFlags } from "@/lib/site-flags";
import {
  ANDROID_PLAY_STORE_URL,
  IOS_APP_STORE_URL,
  SUPPORT_ADDRESS,
  SUPPORT_EMAIL,
  getSupportEmailHref,
} from "@/lib/support";

type FooterLink = { href: string; label: string };

/**
 * The "Explore" column doubles as internal linking for the SEO landing pages,
 * which otherwise have no route into them from anywhere on the site.
 */
const EXPLORE_LINKS: FooterLink[] = [
  { href: "/explore", label: "Browse all cars" },
  { href: "/rent-a-car-accra", label: "Rent a car in Accra" },
  { href: "/airport-car-rental-accra", label: "Airport car rental" },
  { href: "/suv-rental-ghana", label: "SUV rental" },
  { href: "/cheap-car-rental-ghana", label: "Affordable rentals" },
];

const COMPANY_LINKS: FooterLink[] = [
  { href: "/become-host", label: "Become a host" },
  { href: "/list-your-car-ghana", label: "List your car" },
  { href: "/peer-to-peer-car-rental-ghana", label: "How Hayame works" },
  ...(siteFlags.marketing.pricesPage
    ? [{ href: "/prices", label: "Pricing" }]
    : []),
  ...(siteFlags.marketing.blogPage ? [{ href: "/blog", label: "Blog" }] : []),
  { href: "/contact", label: "Contact us" },
];

const LEGAL_LINKS: FooterLink[] = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/protection", label: "Protection policy" },
  { href: "/cancellation", label: "Cancellation policy" },
  { href: "/contact", label: "Get support" },
];

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className="footer-link text-sm !text-white/70 hover:!text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const hasAppLinks = Boolean(IOS_APP_STORE_URL || ANDROID_PLAY_STORE_URL);

  return (
    <footer className="brand-panel relative isolate overflow-hidden">
      {/* Same texture pair as the auth panel, so the two dark surfaces on the
          site read as one system. */}
      <div
        aria-hidden
        className="brand-dots pointer-events-none absolute inset-0 -z-10"
      />
      <div
        aria-hidden
        className="brand-streaks pointer-events-none absolute inset-0 -z-10 opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-40 -z-10 h-[28rem] w-[28rem] rounded-full bg-brand/20 blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-6">
        {/* Conversion band. Most visitors reaching the footer have finished
            reading and are deciding whether to act — give them the two things
            they can actually do. */}
        <div className="flex flex-col gap-5 border-b border-white/10 py-10 sm:flex-row sm:items-center sm:justify-between lg:py-12">
          <div>
            <h2 className="text-xl font-bold tracking-tight !text-white sm:text-2xl">
              Got a car sitting idle?
            </h2>
            <p className="mt-1.5 max-w-lg text-sm !text-white/60">
              List it on Hayame and earn from it on the days you don&apos;t need
              it. Reviewed hosts, secured payments, local support.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/become-host"
              className="group inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold !text-[#06223a] transition-transform hover:scale-[1.02]"
            >
              Start hosting
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex h-11 items-center rounded-xl border border-white/25 px-5 text-sm font-semibold !text-white transition-colors hover:bg-white/10"
            >
              Browse cars
            </Link>
          </div>
        </div>

        {/* Link grid */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-8">
          <div>
            <Link href="/" aria-label="Hayame" className="inline-block">
              <Image
                src="/logo-white.png"
                alt="Hayame"
                width={1808}
                height={944}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed !text-white/60">
              Ghana&apos;s trusted car sharing network. Rent from verified local
              hosts, or earn from the car in your driveway.
            </p>

            <div className="mt-5 space-y-2.5 text-sm">
              <a
                href={getSupportEmailHref()}
                className="footer-link flex items-center gap-2 !text-white/70 hover:!text-white"
              >
                <Mail className="h-4 w-4 shrink-0 text-white/40" />
                {SUPPORT_EMAIL}
              </a>
              <p className="flex items-start gap-2 !text-white/60">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
                {SUPPORT_ADDRESS}
              </p>
            </div>

            {/* Only rendered once the store URLs are configured — an empty
                badge that goes nowhere is worse than no badge. */}
            {hasAppLinks ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {IOS_APP_STORE_URL ? (
                  <a
                    href={IOS_APP_STORE_URL}
                    className="inline-flex h-10 items-center rounded-lg border border-white/20 px-4 text-xs font-semibold !text-white transition-colors hover:bg-white/10"
                  >
                    iOS app
                  </a>
                ) : null}
                {ANDROID_PLAY_STORE_URL ? (
                  <a
                    href={ANDROID_PLAY_STORE_URL}
                    className="inline-flex h-10 items-center rounded-lg border border-white/20 px-4 text-xs font-semibold !text-white transition-colors hover:bg-white/10"
                  >
                    Android app
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <LinkColumn title="Explore" links={EXPLORE_LINKS} />
          <LinkColumn title="Company" links={COMPANY_LINKS} />
          <LinkColumn title="Legal" links={LEGAL_LINKS} />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-5 text-xs !text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} Hayame. All rights reserved.</span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-white/40" />
            Payments secured by Paystack · Built for Ghanaian roads
          </span>
        </div>
      </div>
    </footer>
  );
}
