import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Cancellation Policy | Hayame",
  description:
    "Cancellation policy information for Hayame bookings. Policy tiers are being finalized.",
};

export default function CancellationPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div>
        <p className="text-sm font-semibold text-brand">Booking policy</p>
        <h1 className="text-3xl font-semibold text-foreground">Cancellation policy</h1>
        <p className="mt-2 text-sm text-gray-700">
          Flexible, Moderate, and Strict policy tiers are coming soon. This page will be updated when
          cancellation settings are available in listings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>Cancellation policy selection per listing is coming soon.</p>
          <p>
            Refund outcomes currently depend on booking status and host decisions in the active booking
            flow.
          </p>
          <p>
            For urgent trip changes, contact the host in{" "}
            <Link className="font-semibold text-brand" href="/messages">
              Messages
            </Link>{" "}
            or reach support from the{" "}
            <Link className="font-semibold text-brand" href="/contact">
              Contact
            </Link>{" "}
            page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
