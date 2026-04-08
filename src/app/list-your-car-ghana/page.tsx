import type { Metadata } from "next";
import { SeoLandingTemplate } from "@/components/seo/landing-template";

export const metadata: Metadata = {
  title: "List Your Car in Ghana | Hayame",
  description:
    "Apply to become a host and list your car on Hayame. Manage listings, availability, and bookings from your dashboard.",
};

export default function ListYourCarGhanaPage() {
  return (
    <SeoLandingTemplate
      title="List Your Car in Ghana"
      intro="Turn your vehicle into an earning asset. Apply as a host, create your listing, and manage trips from your host dashboard."
      faqs={[
        {
          question: "Who can list a car?",
          answer:
            "Approved hosts can publish listings and manage bookings on Hayame.",
        },
        {
          question: "What do I need before publishing?",
          answer:
            "A complete listing, availability setup, and at least 5 quality photos.",
        },
        {
          question: "How can I estimate earnings?",
          answer:
            "The host dashboard includes an earnings calculator for monthly estimates.",
        },
      ]}
    />
  );
}
