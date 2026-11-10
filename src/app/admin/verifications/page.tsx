import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminSearchForm } from "@/components/admin/admin-search";
import {
  PageHeader,
  Panel,
  dangerButtonClass,
  inputClass,
  primaryButtonClass,
} from "@/components/admin/admin-ui";
import { EvidenceGallery } from "@/components/admin/image-lightbox";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import { requireAdmin } from "@/lib/admin-auth";
import { matchesQuery } from "@/lib/admin-search";
import {
  RENTER_VERIFICATION_TABLE,
  isMissingRenterVerificationTable,
  isRenterVerificationRequired,
  renterVerificationBucket,
  reviewRenterVerification,
} from "@/lib/renter-verification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Filter = "pending" | "approved" | "rejected" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "Waiting for review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const REJECTION_PRESETS = [
  "The face photo is blurry or too dark. Please retake it in good light.",
  "Your face is partly covered. Please retake it without sunglasses, a hat or a mask.",
  "The driving licence photo is blurry or cut off. Please show the whole card, flat and in focus.",
  "The back of the driving licence is missing or unreadable.",
  "The driving licence has expired. Please send a valid licence.",
  "The face photo does not match the photo on the licence.",
  "The document is not a driving licence. Please send your driving licence.",
];

function resolveFilter(raw?: string): Filter {
  return raw === "approved" || raw === "rejected" || raw === "all"
    ? raw
    : "pending";
}

function formatWhen(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " GMT";
}

function waitingFor(value?: string | null) {
  if (!value) return null;
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (!Number.isFinite(minutes)) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} days`;
}

async function reviewVerificationAction(formData: FormData) {
  "use server";
  const actor = await requireAdmin("applications.review");
  const verificationId = String(formData.get("verificationId") ?? "");
  const action = String(formData.get("action") ?? "");
  const status = resolveFilter(String(formData.get("status") ?? ""));
  const back = (notice: string) =>
    redirect(`/admin/verifications?status=${status}&notice=${notice}`);

  if (!verificationId || !["approve", "reject"].includes(action)) back("invalid");

  const typed = String(formData.get("rejectionReason") ?? "").trim();
  const preset = String(formData.get("preset") ?? "").trim();
  const reason = [preset, typed].filter(Boolean).join(" ").slice(0, 600);
  if (action === "reject" && !reason) back("reason-needed");

  let outcome: string;
  try {
    const result = await reviewRenterVerification({
      admin: createSupabaseAdminClient() as any,
      verificationId,
      action: action as "approve" | "reject",
      rejectionReason: reason,
      actor,
    });
    outcome = result.outcome;
  } catch (error) {
    console.error("[admin/verifications] review failed", error);
    outcome = "failed";
  }
  back(outcome);
}

const NOTICES: Record<string, { tone: "success" | "error" | "info"; title: string; description?: string }> = {
  approved: { tone: "success", title: "Renter approved", description: "They have been emailed and notified, and can book now." },
  rejected: { tone: "success", title: "Verification rejected", description: "They have been emailed your note and asked to send new photos." },
  stale: { tone: "info", title: "Already decided", description: "Someone else reviewed this one a moment ago. Nothing was changed." },
  not_found: { tone: "error", title: "That verification no longer exists" },
  "reason-needed": { tone: "error", title: "Add a reason", description: "Pick or type what the renter needs to fix so they know what to resend." },
  invalid: { tone: "error", title: "That action could not be read. Please try again." },
  failed: { tone: "error", title: "The decision was not saved", description: "Nothing was changed. Please try again." },
};

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; notice?: string }>;
}) {
  await requireAdmin("applications.review");
  const params = await searchParams;
  const filter = resolveFilter(params.status);
  const query = (params.q ?? "").trim();
  const notice = params.notice ? NOTICES[params.notice] : null;
  const admin = createSupabaseAdminClient() as any;

  let rowsQuery = admin
    .from(RENTER_VERIFICATION_TABLE)
    .select(
      "id,user_id,status,face_path,licence_front_path,licence_back_path,submitted_at,reviewed_at,reviewed_by,rejection_reason,created_at",
    )
    // Oldest first while reviewing, so nobody is left waiting behind newer ones.
    .order("submitted_at", { ascending: filter === "pending" })
    .limit(query ? 300 : 60);
  if (filter !== "all") rowsQuery = rowsQuery.eq("status", filter);
  const { data: rawRows, error } = await rowsQuery;
  const tableMissing = isMissingRenterVerificationTable(error);

  const counts: Record<string, number> = {};
  if (!tableMissing) {
    await Promise.all(
      (["pending", "approved", "rejected"] as const).map(async (status) => {
        const { count } = await admin
          .from(RENTER_VERIFICATION_TABLE)
          .select("id", { count: "exact", head: true })
          .eq("status", status);
        counts[status] = count ?? 0;
      }),
    );
  }

  const baseRows = (rawRows ?? []) as any[];
  const userIds = Array.from(new Set(baseRows.map((row) => String(row.user_id))));
  const profilesById = new Map<string, any>();
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id,full_name,phone,city,is_host")
      .in("id", userIds);
    (profiles ?? []).forEach((profile: any) => profilesById.set(String(profile.id), profile));
  }
  const emailsById = new Map<string, string | null>();
  await Promise.all(
    userIds.map(async (id) => {
      try {
        const { data } = await admin.auth.admin.getUserById(id);
        emailsById.set(id, data?.user?.email ?? null);
      } catch {
        emailsById.set(id, null);
      }
    }),
  );

  const rows = baseRows
    .filter((row) => {
      if (!query) return true;
      const profile = profilesById.get(String(row.user_id));
      return matchesQuery(
        query,
        profile?.full_name,
        profile?.phone,
        profile?.city,
        emailsById.get(String(row.user_id)),
      );
    })
    .slice(0, 60);

  // One batch of short-lived links for the photos on screen.
  const paths = rows.flatMap((row) => [row.face_path, row.licence_front_path, row.licence_back_path]).filter(Boolean);
  const signedByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await admin.storage
      .from(renterVerificationBucket())
      .createSignedUrls(paths, 60 * 15);
    (signed ?? []).forEach((item: any) => {
      if (item?.path && item?.signedUrl) signedByPath.set(item.path, item.signedUrl);
    });
  }

  const gateOn = isRenterVerificationRequired() && !tableMissing;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Renter verification"
        description="Check each renter's face photo against their driving licence. Nobody can pay for a booking until they are approved here."
        actions={
          <AdminSearchForm
            action="/admin/verifications"
            placeholder="Search by name, email, phone or city"
            query={query}
            keep={{ status: filter }}
          />
        }
      />

      {notice ? <AdminNotice tone={notice.tone} title={notice.title} description={notice.description} /> : null}

      {tableMissing ? (
        <AdminNotice
          tone="error"
          title="Verification is not switched on yet"
          description="The database table is missing. Run db/patch_renter_verifications.sql in the Supabase SQL editor. Until then renters can book without being verified, and nobody can submit photos."
        />
      ) : !gateOn ? (
        <AdminNotice
          tone="info"
          title="The booking gate is switched off"
          description="RENTER_VERIFICATION_REQUIRED is set to false, so renters can book without approval. Submissions still arrive here."
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = item.key === filter;
          const count = item.key === "all" ? null : counts[item.key];
          return (
            <Link
              key={item.key}
              href={`/admin/verifications?status=${item.key}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${active ? "border-brand bg-brand text-white" : "border-border bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              {item.label}
              {typeof count === "number" ? <span className={`ml-2 ${active ? "text-white/80" : "text-gray-500"}`}>{count}</span> : null}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <Panel>
          <p className="text-sm text-gray-600">
            {tableMissing
              ? "Nothing to show until the table is created."
              : query
                ? "No verifications match that search."
                : filter === "pending"
                  ? "Nobody is waiting. New submissions arrive here and by email."
                  : "Nothing here yet."}
          </p>
        </Panel>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const userId = String(row.user_id);
            const profile = profilesById.get(userId);
            const email = emailsById.get(userId);
            const name = profile?.full_name || email || "Unnamed user";
            const waited = row.status === "pending" ? waitingFor(row.submitted_at) : null;
            const statusClass =
              row.status === "approved"
                ? "bg-emerald-100 text-emerald-800"
                : row.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : "bg-amber-100 text-amber-900";
            return (
              <Panel key={row.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/admin/users/${userId}`} className="text-base font-bold text-[#0A2B54] hover:underline">
                      {name}
                    </Link>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {[email, profile?.phone, profile?.city].filter(Boolean).join(" · ") || "No contact details"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Sent {formatWhen(row.submitted_at)}
                      {waited ? ` · waiting ${waited}` : ""}
                      {profile?.is_host ? " · also a host" : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClass}`}>{row.status}</span>
                </div>

                <div className="mt-4">
                  <EvidenceGallery
                    items={[
                      { label: "Face photo", src: signedByPath.get(row.face_path) ?? null, empty: "Photo could not be loaded." },
                      { label: "Licence front", src: signedByPath.get(row.licence_front_path) ?? null, empty: "Photo could not be loaded." },
                      { label: "Licence back", src: signedByPath.get(row.licence_back_path) ?? null, empty: "Photo could not be loaded." },
                    ]}
                  />
                </div>

                {row.status !== "pending" ? (
                  <p className="mt-3 text-xs text-gray-600">
                    {row.status === "approved" ? "Approved" : "Rejected"} {formatWhen(row.reviewed_at)}
                    {row.reviewed_by ? ` by ${row.reviewed_by}` : ""}
                    {row.status === "rejected" && row.rejection_reason ? `. Reason: ${row.rejection_reason}` : ""}
                  </p>
                ) : null}

                <div className="mt-4 grid gap-3 border-t border-border/70 pt-4 lg:grid-cols-[auto_1fr]">
                  {row.status !== "approved" ? (
                    <form action={reviewVerificationAction} className="self-start">
                      <input type="hidden" name="verificationId" value={row.id} />
                      <input type="hidden" name="status" value={filter} />
                      <input type="hidden" name="action" value="approve" />
                      <PendingSubmitButton className={primaryButtonClass} pendingLabel="Approving...">
                        Approve renter
                      </PendingSubmitButton>
                    </form>
                  ) : (
                    <p className="self-center text-sm font-semibold text-emerald-700">This renter can book.</p>
                  )}
                  {row.status !== "rejected" ? (
                    <form action={reviewVerificationAction} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input type="hidden" name="verificationId" value={row.id} />
                      <input type="hidden" name="status" value={filter} />
                      <input type="hidden" name="action" value="reject" />
                      <select name="preset" defaultValue="" className={inputClass} aria-label="Reason for rejecting">
                        <option value="">Choose what to fix...</option>
                        {REJECTION_PRESETS.map((preset) => (
                          <option key={preset} value={preset}>
                            {preset}
                          </option>
                        ))}
                      </select>
                      <input
                        name="rejectionReason"
                        maxLength={300}
                        placeholder="Or add your own note to the renter"
                        className={inputClass}
                        aria-label="Note to the renter"
                      />
                      <PendingSubmitButton className={dangerButtonClass} pendingLabel="Rejecting...">
                        {row.status === "approved" ? "Revoke approval" : "Reject"}
                      </PendingSubmitButton>
                    </form>
                  ) : null}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
