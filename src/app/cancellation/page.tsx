import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Cancellation Policy | Hayame",
  description:
    "Cancellation policy information for Hayame bookings with flexible, moderate, and strict tiers.",
};

export default function CancellationPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div>
        <p className="text-sm font-semibold text-brand">Booking policy</p>
        <h1 className="text-3xl font-semibold text-foreground">
          Cancellation policy
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Each listing can be set to Flexible, Moderate, or Strict cancellation.
          The listing policy is shown before payment in checkout and in your
          bookings view.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy tiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-700">
          <p>
            <span className="font-semibold text-foreground">Flexible:</span>{" "}
            Best for last-minute changes. Use this for listings that can be
            rebooked quickly.
          </p>
          <p>
            <span className="font-semibold text-foreground">Moderate:</span>{" "}
            Balanced terms for both guest and host. This is the default policy
            for new listings.
          </p>
          <p>
            <span className="font-semibold text-foreground">Strict:</span> For
            high-demand listings where late cancellations create higher risk.
          </p>
          <p>
            Refund outcomes depend on booking/payment status and the selected
            listing policy at the time of booking.
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
