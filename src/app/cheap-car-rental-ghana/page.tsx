import type { Metadata } from "next";
import { SeoLandingTemplate } from "@/components/seo/landing-template";

export const metadata: Metadata = {
  title: "Cheap Car Rental Ghana | Hayame",
  description:
    "Browse budget-friendly car rentals in Ghana. Filter by price, seats, and transmission on Hayame.",
};

export default function CheapCarRentalGhanaPage() {
  return (
    <SeoLandingTemplate
      title="Cheap Car Rental in Ghana"
      intro="Looking for lower daily rates? Use Hayame's price filters to compare cars that match your budget."
      faqs={[
        {
          question: "How can I find lower-priced cars?",
          answer:
            "Use min and max price filters, then sort by Price (Low -> High).",
        },
        {
          question: "Are prices shown per day?",
          answer:
            "Yes. Listing cards and booking summaries show daily pricing in GHS.",
        },
        {
          question: "Are extra fees always included?",
          answer:
            "Booking summaries clearly show charged amounts and items marked as coming soon.",
        },
      ]}
    />
  );
}
