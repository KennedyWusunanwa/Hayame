import Link from "next/link";
import { siteFlags } from "@/lib/site-flags";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="relative h-16 w-16 overflow-hidden rounded-full bg-transparent"
            aria-label="Hayame"
          >
            <div
              className="absolute inset-0 bg-center bg-contain bg-no-repeat"
              style={{ backgroundImage: "url('/logo.png')" }}
            />
          </Link>
          <div>
            <p className="text-sm text-gray-600">Premium car sharing across Ghana.</p>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <p className="font-semibold text-foreground">Company</p>
          <div className="mt-3 flex flex-col gap-2">
            {siteFlags.marketing.pricesPage ? (
              <Link href="/prices" className="hover:text-brand">
                Pricing
              </Link>
            ) : null}
            {siteFlags.marketing.blogPage ? (
              <Link href="/blog" className="hover:text-brand">
                Blog
              </Link>
            ) : null}
            <Link href="/contact" className="hover:text-brand">
              Contact
            </Link>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <p className="font-semibold text-foreground">Legal</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/privacy" className="hover:text-brand">
              Privacy
            </Link>
            <Link href="/protection" className="hover:text-brand">
              Protection
            </Link>
            <Link href="/contact" className="hover:text-brand">
              Support
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-sm text-gray-600">
          <span>© {new Date().getFullYear()} Hayame. All rights reserved.</span>
          <span className="text-gray-500">Built for Ghanaian roads.</span>
        </div>
      </div>
    </footer>
  );
}
