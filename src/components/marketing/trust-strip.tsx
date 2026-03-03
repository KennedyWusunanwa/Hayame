import Link from "next/link";
import { BadgeCheck, CreditCard, Crown, Shield, Truck, Zap } from "lucide-react";

const items = [
  { label: "Verified identity checks", Icon: BadgeCheck },
  { label: "Protection details", Icon: Shield },
  { label: "Secure payments", Icon: CreditCard },
  { label: "Instant booking where available", Icon: Zap },
  { label: "Delivery options rolling out", Icon: Truck },
  { label: "Top host recognition", Icon: Crown },
];

export function TrustStrip() {
  return (
    <section className="mx-auto mt-8 hidden max-w-6xl px-6 md:block">
      <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-foreground">
            Trust &amp; protection details for every trip.
          </p>
          <Link href="/protection" className="text-sm font-semibold text-brand">
            View protection details
          </Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ label, Icon }) => (
            <div
              key={label}
              className="flex min-h-12 items-center gap-2 rounded-lg border border-border bg-gray-50 px-3 py-2 text-xs font-semibold text-foreground sm:text-sm"
            >
              <Icon className="h-4 w-4 shrink-0 text-brand" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
