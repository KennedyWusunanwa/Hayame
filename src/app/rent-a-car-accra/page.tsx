import type { Metadata } from "next";
import { SeoLandingTemplate } from "@/components/seo/landing-template";

export const metadata: Metadata = {
  title: "Rent a Car in Accra | Hayame",
  description:
    "Find peer-to-peer car rentals in Accra on Hayame. Compare listings, check availability, and book online.",
};

export default function RentACarAccraPage() {
  return (
    <SeoLandingTemplate
      title="Rent a Car in Accra"
      intro="Explore local cars from hosts across Accra. Compare rates, choose your dates, and book with transparent pricing."
      faqs={[
        {
          question: "Can I search by area in Accra?",
          answer:
            "Yes. Use the Explore filters for city and region to narrow listings.",
        },
        {
          question: "How do I know if dates are open?",
          answer:
            "Open a listing and use the availability preview to check your trip dates.",
        },
        {
          question: "Do all cars support instant booking?",
          answer:
            "No. Some listings use Instant Book, while others require host approval.",
        },
      ]}
    />
  );
}
