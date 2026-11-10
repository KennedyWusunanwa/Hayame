import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal-document";
import { LEGAL_DOCUMENTS, legalFaqJsonLd } from "@/lib/legal-docs";

const doc = LEGAL_DOCUMENTS.cancellation;

export const metadata: Metadata = {
  title: "Cancellation Policy | Hayame",
  description:
    "What you get back when a Hayame trip is cancelled: the Flexible, Moderate and Strict policies, deposits, host cancellations, no-shows and how refunds are paid.",
};

export default function CancellationPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(legalFaqJsonLd(doc)) }}
      />
      <LegalDocumentView document={doc} />
    </div>
  );
}
