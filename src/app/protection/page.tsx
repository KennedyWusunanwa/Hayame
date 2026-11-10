import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal-document";
import { LEGAL_DOCUMENTS, legalFaqJsonLd } from "@/lib/legal-docs";

const doc = LEGAL_DOCUMENTS.protection;

export const metadata: Metadata = {
  title: "Protection | Hayame",
  description:
    "How Hayame keeps renters, hosts and cars safe in Ghana: identity checks, secure payments, deposits, accidents, damage and disputes, answered question by question.",
};

export default function ProtectionPage() {
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
