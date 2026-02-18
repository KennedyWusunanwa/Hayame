import type { Metadata } from "next";
import { SeoLandingTemplate } from "@/components/seo/landing-template";

export const metadata: Metadata = {
  title: "Peer-to-Peer Car Rental Ghana | Hayame",
  description:
    "Learn how peer-to-peer car rental works in Ghana with Hayame for both guests and hosts.",
};

export default function PeerToPeerCarRentalGhanaPage() {
  return (
    <SeoLandingTemplate
      title="Peer-to-Peer Car Rental in Ghana"
      intro="Hayame connects guests and local hosts directly, with online booking, messaging, and listing management tools."
      faqs={[
        {
          question: "What is peer-to-peer car rental?",
          answer: "It allows vehicle owners to list cars for guests to book directly on the platform.",
        },
        {
          question: "How are bookings confirmed?",
          answer: "Some listings support Instant Book; others are confirmed after host approval.",
        },
        {
          question: "Can hosts manage blocked dates?",
          answer: "Yes. Hosts can set one-off and recurring availability blocks from the dashboard.",
        },
      ]}
    />
  );
}
