import type { Metadata } from "next";
import { TermsAgreement } from "@/components/terms-agreement";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  TERMS_LAST_UPDATED,
  TERMS_SECTIONS,
  TERMS_TITLE,
  TERMS_VERSION,
  readTermsAcceptance,
} from "@/lib/terms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Service | Hayame",
  description:
    "The rules for renting and hosting on Hayame in Ghana: who may drive, payments and deposits, cancellations, how cars may be used, and what happens when something goes wrong.",
};

/** Only same-site paths are honoured, so the link cannot bounce people elsewhere. */
function safeNext(raw?: string) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export default async function TermsPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; from?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const acceptance = readTermsAcceptance(user);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      {params.from === "booking" && !acceptance.accepted ? (
        <p className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          One step before you book: please read and accept our terms. Scroll to
          the end to continue.
        </p>
      ) : null}
      <TermsAgreement
        version={TERMS_VERSION}
        title={TERMS_TITLE}
        lastUpdated={TERMS_LAST_UPDATED}
        sections={TERMS_SECTIONS}
        signedIn={Boolean(user)}
        accepted={Boolean(user) && acceptance.accepted}
        acceptedAt={acceptance.accepted ? acceptance.acceptedAt : null}
        next={next}
      />
    </div>
  );
}
