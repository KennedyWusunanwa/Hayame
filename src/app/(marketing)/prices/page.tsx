import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteFlags } from "@/lib/site-flags";
import { formatCurrency } from "@/lib/utils";

const tiers = [
  {
    name: "Economy",
    price: 320,
    description: "Compact cars for errands and quick city rides.",
    features: [
      "Up to 150 km/day",
      "Basic insurance guidance",
      "Great fuel economy",
    ],
  },
  {
    name: "Standard",
    price: 650,
    description: "Balanced comfort and space for most Ghana trips.",
    features: [
      "Up to 200 km/day",
      "Flexible pickup windows",
      "Free reschedule within 24h",
    ],
    highlighted: true,
  },
  {
    name: "Premium",
    price: 1100,
    description: "Luxury and SUVs with premium host support.",
    features: [
      "Up to 250 km/day",
      "Priority host support",
      "Airport handoff assistance",
    ],
  },
];

export default function PricesPage() {
  if (!siteFlags.marketing.pricesPage) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold text-primary">Pricing</p>
        <h1 className="text-3xl font-semibold text-foreground">
          Transparent daily rates
        </h1>
        <p className="text-gray-700">
          Prices are set by hosts. We show the total before you book. Paystack
          integration is coming soon—book now and pay on handoff with digital
          receipts.
        </p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={
              tier.highlighted ? "border-primary shadow-soft" : undefined
            }
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {tier.name}
                {tier.highlighted ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Popular
                  </span>
                ) : null}
              </CardTitle>
              <div className="text-3xl font-semibold text-foreground">
                {formatCurrency(tier.price)}
                <span className="text-base text-gray-500">/day</span>
              </div>
              <p className="text-sm text-gray-700">{tier.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {tier.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </div>
              ))}
              <Button className="mt-3 w-full">Start booking</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
