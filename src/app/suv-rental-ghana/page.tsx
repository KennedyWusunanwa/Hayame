import type { Metadata } from "next";
import { SeoLandingTemplate } from "@/components/seo/landing-template";

export const metadata: Metadata = {
  title: "SUV Rental Ghana | Hayame",
  description:
    "Find SUVs for city and upcountry trips in Ghana. Compare features, seats, and booking options.",
};

export default function SuvRentalGhanaPage() {
  return (
    <SeoLandingTemplate
      title="SUV Rental in Ghana"
      intro="Need extra space or road confidence? Browse SUVs listed by local hosts and compare capacity and price."
      faqs={[
        {
          question: "Can I filter by seat count?",
          answer:
            "Yes. Explore includes seat filters, including 7-seater and 8+ options.",
        },
        {
          question: "Can I check transmission type?",
          answer: "Yes. Filter by Automatic or Manual in Explore.",
        },
        {
          question: "Are all SUVs available for all dates?",
          answer:
            "Availability varies per listing. Use each listing's date checker before booking.",
        },
      ]}
    />
  );
}
