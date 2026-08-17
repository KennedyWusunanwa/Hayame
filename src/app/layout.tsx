import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { SiteChrome } from "@/components/site-chrome";
import { NavigationLoader } from "@/components/navigation-loader";
import { MessagingProvider } from "@/components/messages/messaging-provider";
import { ConsentBanner } from "@/components/consent-banner";
import { socialImageAlt } from "@/components/seo/social-preview-image";
import { resolveSiteUrl } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = resolveSiteUrl();

const metadataBase = siteUrl ? new URL(siteUrl) : undefined;
const socialImage = "/opengraph-image";
const twitterSocialImage = "/twitter-image";

export const metadata: Metadata = {
  metadataBase,
  title: "Hayame - Ghana's No.1 Car Rental Service",
  description:
    "Turo-style peer-to-peer car rental marketplace for Ghana. Rent anytime, anywhere.",
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Hayame - Ghana's No.1 Car Rental Service",
    description:
      "Rent trusted cars in Ghana with airport pickup, verified hosts, and flexible bookings.",
    url: "/",
    siteName: "Hayame",
    type: "website",
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: socialImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hayame - Ghana's No.1 Car Rental Service",
    description:
      "Rent trusted cars in Ghana with airport pickup, verified hosts, and flexible bookings.",
    images: [
      {
        url: twitterSocialImage,
        width: 1200,
        height: 630,
        alt: socialImageAlt,
      },
    ],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <noscript>
          <style>{`.reveal { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
        <MessagingProvider>
          <div className="flex min-h-screen flex-col">
            <SiteChrome>
              <Navbar />
            </SiteChrome>
            <Suspense fallback={null}>
              <NavigationLoader />
            </Suspense>
            <main className="flex-1 page-fade">{children}</main>
            <SiteChrome>
              <Footer />
            </SiteChrome>
          </div>
          <ConsentBanner />
        </MessagingProvider>
      </body>
    </html>
  );
}
