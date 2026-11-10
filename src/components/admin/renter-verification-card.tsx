import Link from "next/link";
import { EvidenceGallery } from "@/components/admin/image-lightbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RENTER_VERIFICATION_TABLE,
  renterVerificationBucket,
} from "@/lib/renter-verification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * A renter's latest identity check on their admin profile: status, the three
 * photos, and a link to the review queue where the decision is made.
 */
export async function RenterVerificationCard({
  userId,
  canReview,
}: {
  userId: string;
  canReview: boolean;
}) {
  const admin = createSupabaseAdminClient() as any;
  const { data: rows, error } = await admin
    .from(RENTER_VERIFICATION_TABLE)
    .select(
      "id,status,face_path,licence_front_path,licence_back_path,submitted_at,reviewed_at,reviewed_by,rejection_reason,created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) return null;

  const list = (rows ?? []) as any[];
  const latest = list.find((row) => row.status === "approved") ?? list[0] ?? null;

  const signed = new Map<string, string>();
  if (latest && canReview) {
    const { data } = await admin.storage
      .from(renterVerificationBucket())
      .createSignedUrls(
        [latest.face_path, latest.licence_front_path, latest.licence_back_path],
        60 * 15,
      );
    (data ?? []).forEach((item: any) => {
      if (item?.path && item?.signedUrl) signed.set(item.path, item.signedUrl);
    });
  }

  const status = latest ? String(latest.status) : "none";
  const pill =
    status === "approved"
      ? { label: "Verified, can book", className: "bg-emerald-100 text-emerald-800" }
      : status === "pending"
        ? { label: "Waiting for review", className: "bg-amber-100 text-amber-900" }
        : status === "rejected"
          ? { label: "Rejected, cannot book", className: "bg-red-100 text-red-800" }
          : { label: "Not submitted, cannot book", className: "bg-gray-100 text-gray-700" };
  const stamp = (value?: string | null) =>
    value
      ? new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })
      : "N/A";

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Renter verification (needed to book)</CardTitle>
        {canReview ? (
          <Link
            href={`/admin/verifications?status=${status === "none" ? "pending" : status}`}
            className="text-sm font-semibold text-brand"
          >
            {status === "pending" ? "Review now" : "Open review queue"}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 px-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2 py-1 font-semibold ${pill.className}`}>{pill.label}</span>
          {latest ? (
            <span className="text-gray-600">
              Sent {stamp(latest.submitted_at)}
              {latest.reviewed_at ? ` · decided ${stamp(latest.reviewed_at)}${latest.reviewed_by ? ` by ${latest.reviewed_by}` : ""}` : ""}
              {list.length > 1 ? ` · ${list.length} submissions` : ""}
            </span>
          ) : null}
        </div>
        {status === "rejected" && latest?.rejection_reason ? (
          <p className="text-sm text-gray-700">Reason given: {latest.rejection_reason}</p>
        ) : null}
        {latest && canReview ? (
          <EvidenceGallery
            items={[
              { label: "Face photo", src: signed.get(latest.face_path) ?? null, empty: "Photo could not be loaded." },
              { label: "Licence front", src: signed.get(latest.licence_front_path) ?? null, empty: "Photo could not be loaded." },
              { label: "Licence back", src: signed.get(latest.licence_back_path) ?? null, empty: "Photo could not be loaded." },
            ]}
          />
        ) : !latest ? (
          <p className="text-sm text-gray-600">
            This user has not sent a face photo and driving licence yet. They are asked for them when they try to pay for a booking.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
