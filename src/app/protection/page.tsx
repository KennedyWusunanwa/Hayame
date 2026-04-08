import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/support";

export const metadata: Metadata = {
  title: "Protection | Hayame",
  description:
    "Learn how support, evidence review, deposits, and disputes currently work on Hayame.",
};

const sections = [
  {
    title: "Damage and incident reporting",
    body: "Hayame does not advertise bundled insurance on the platform today. Hosts should only list cars they are authorized to rent out and insure, and guests should report any new damage or trip issues promptly in Messages or Support.",
  },
  {
    title: "Trip records and support review",
    body: "Trip dates, pricing, messages, uploaded photos, and booking status are retained in the trip record so support can review cancellations, disputes, and post-trip issues consistently.",
  },
  {
    title: "Host and guest accountability",
    body: "Identity, phone, and email verification states are shown where available. When a policy breach or misuse report is raised, Hayame may review listing details, trip history, and conversation records before taking action.",
  },
  {
    title: "Deposits and extra fees",
    body: "If a listing includes a security deposit or trip fee, the amount is shown before checkout and recorded on the booking. Any deduction should be backed by trip evidence or an open dispute.",
  },
  {
    title: "Disputes and emergency support",
    body: `For accidents or immediate safety issues, contact local emergency services first. Then notify the other party and reach Hayame via Messages, the dispute flow, or ${SUPPORT_EMAIL}.`,
  },
];

export default function ProtectionPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-brand">Trust & Safety</p>
        <h1 className="text-3xl font-semibold text-foreground">
          Protection overview
        </h1>
        <p className="text-sm text-gray-700">
          This page describes the support, evidence, and dispute process
          currently available on Hayame.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Hayame does not publish bundled insurance coverage on this page. Any
            third-party cover must be confirmed directly with the vehicle owner.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-brand" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700">
              {section.body}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white p-4 text-sm text-gray-700">
        Need booking help now? Visit the{" "}
        <Link href="/contact" className="font-semibold text-brand">
          contact page
        </Link>{" "}
        or call {SUPPORT_PHONE}.
      </div>
    </div>
  );
}
