import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { NavigationLoader } from "@/components/navigation-loader";
import { MessagingProvider } from "@/components/messages/messaging-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hayame 2.0 · Ghana Car Sharing",
  description:
    "Turo-style peer-to-peer car rental marketplace for Ghana. Rent anytime, anywhere.",
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
        <MessagingProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <Suspense fallback={null}>
              <NavigationLoader />
            </Suspense>
            <main className="flex-1 page-fade">{children}</main>
            <Footer />
          </div>
        </MessagingProvider>
      </body>
    </html>
  );
}
