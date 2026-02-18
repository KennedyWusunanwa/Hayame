import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Protection | Hayame",
  description:
    "Learn how protection features are planned for hosts and guests on Hayame. This page is informational.",
};

const sections = [
  {
    title: "Damage protection",
    body: "Coming soon. Coverage and claim terms will be listed here once a policy is finalized.",
  },
  {
    title: "Host protection",
    body: "Coming soon. Host-side incident and asset protection details will be published here.",
  },
  {
    title: "Trip coverage",
    body: "Coming soon. Guest and host trip coverage terms will be listed when available.",
  },
  {
    title: "Deposit protection",
    body: "Coming soon. Deposit handling and release timelines will be documented here.",
  },
  {
    title: "Disputes & emergency support",
    body: "Coming soon. Contact flow and escalation steps will be added after support policies are published.",
  },
];

export default function ProtectionPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-brand">Trust & Safety</p>
        <h1 className="text-3xl font-semibold text-foreground">Protection overview</h1>
        <p className="text-sm text-gray-700">
          Coverage details depend on the policy in effect. This page is informational and will be
          updated as protection features roll out.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Protection details here are placeholders and should not be treated as active insurance.
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
            <CardContent className="text-sm text-gray-700">{section.body}</CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white p-4 text-sm text-gray-700">
        Need booking help now? Visit the{" "}
        <Link href="/contact" className="font-semibold text-brand">
          contact page
        </Link>
        .
      </div>
    </div>
  );
}
