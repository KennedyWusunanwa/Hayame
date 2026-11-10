import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RenterVerificationForm } from "@/components/renter-verification-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getRenterVerificationState,
  renterVerificationDto,
} from "@/lib/renter-verification";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify your identity",
  robots: { index: false, follow: false },
};

/** Only same-site paths are honoured, so the link cannot bounce people elsewhere. */
function safeNext(raw?: string) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export default async function VerifyPage({
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
  if (!user) {
    const back = next ? `/verify?next=${encodeURIComponent(next)}` : "/verify";
    redirect(`/auth/login?next=${encodeURIComponent(back)}`);
  }

  const db = (() => {
    try {
      return createSupabaseAdminClient() as any;
    } catch {
      return supabase as any;
    }
  })();
  const state = await getRenterVerificationState(db, user.id)
    .then(renterVerificationDto)
    .catch(() => null);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-primary">Identity check</p>
        <h1 className="text-3xl font-semibold text-foreground">
          Verify your identity to book
        </h1>
        <p className="text-sm text-gray-600">
          Hayame checks every driver before their first trip. Send a photo of
          your face and both sides of your driving licence. It takes about a
          minute, and you only do it once.
        </p>
      </div>

      {params.from === "booking" && state && !state.canBook ? (
        <p className="mt-6 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {state.status === "pending"
            ? "Your booking is one step away. We are reviewing your photos and will email you as soon as you can book."
            : "One step before you pay: we need to verify you first. Once you are approved you can go back and finish your booking."}
        </p>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Your verification</CardTitle>
        </CardHeader>
        <CardContent>
          {state ? (
            <RenterVerificationForm initial={state} next={next} />
          ) : (
            <p className="text-sm text-gray-700">
              We couldn&apos;t load your verification just now. Please refresh
              the page, or{" "}
              <Link href="/contact" className="font-semibold text-primary">
                contact support
              </Link>{" "}
              if it keeps happening.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-gray-500">
        Your photos are stored privately and are only seen by the Hayame team.
        They are never shown to hosts or other users. See our{" "}
        <Link href="/privacy" className="font-semibold text-primary">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
