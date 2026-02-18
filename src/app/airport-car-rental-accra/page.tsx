import type { Metadata } from "next";
import { SeoLandingTemplate } from "@/components/seo/landing-template";

export const metadata: Metadata = {
  title: "Airport Car Rental Accra | Hayame",
  description:
    "Plan your Accra airport pickup with peer-to-peer car rentals. Check listing details and booking flow on Hayame.",
};

export default function AirportCarRentalAccraPage() {
  return (
    <SeoLandingTemplate
      title="Airport Car Rental in Accra"
      intro="Book a car ahead of arrival and coordinate handoff details with the host through in-app messaging."
      faqs={[
        {
          question: "Can I message the host before pickup?",
          answer: "Yes. You can start or continue chat directly from listing pages and Messages.",
        },
        {
          question: "Is delivery to airport guaranteed?",
          answer: "Delivery options are rolling out and vary by listing.",
        },
        {
          question: "How do I pay for the trip?",
          answer: "Booking checkout uses Paystack for supported payment methods.",
        },
      ]}
    />
  );
}
