import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/admin-audit";
import type { AdminIdentity } from "@/lib/admin-identity";
import {
  buildRenterVerificationDecisionEmail,
  sendEmailSafe,
} from "@/lib/email";
import { sendPushNotificationsToUsers } from "@/lib/push";

// Renter identity verification: a face photo plus both sides of a driving
// licence, approved by an admin, before a renter may hold dates or pay.
//
// The gate is enforced on the server (the hold route) so the website and every
// app version obey it. Two deliberate safety valves keep bookings working:
//   * RENTER_VERIFICATION_REQUIRED=false switches the gate off without a deploy.
//   * If the renter_verifications table has not been created yet
//     (db/patch_renter_verifications.sql), the gate is off rather than blocking
//     every booking.

export const RENTER_VERIFICATION_TABLE = "renter_verifications";

export type RenterVerificationStatus =
  | "unverified"
  | "pending"
  | "approved"
  | "rejected";

export type RenterVerificationState = {
  status: RenterVerificationStatus;
  /** False when the gate is switched off or the table is missing. */
  required: boolean;
  /** The one thing booking code should look at. */
  canBook: boolean;
  /** False when the table is missing: nobody can submit yet. */
  available: boolean;
  verificationId: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

export function renterVerificationBucket() {
  return process.env.NEXT_PUBLIC_SUPABASE_HOST_ID_BUCKET || "host-ids";
}

export function isRenterVerificationRequired() {
  const raw = (process.env.RENTER_VERIFICATION_REQUIRED ?? "true")
    .trim()
    .toLowerCase();
  return !["false", "0", "off", "no"].includes(raw);
}

/** True when Postgres / PostgREST is telling us the table does not exist. */
export function isMissingRenterVerificationTable(error: any) {
  if (!error) return false;
  const code = String(error.code ?? "");
  const message = String(error.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    (message.includes(RENTER_VERIFICATION_TABLE) &&
      (message.includes("does not exist") ||
        message.includes("could not find the table") ||
        message.includes("schema cache")))
  );
}

function buildState(
  partial: Partial<RenterVerificationState> & {
    status: RenterVerificationStatus;
    available: boolean;
  },
): RenterVerificationState {
  const required = isRenterVerificationRequired() && partial.available;
  return {
    verificationId: null,
    submittedAt: null,
    reviewedAt: null,
    rejectionReason: null,
    ...partial,
    required,
    canBook: !required || partial.status === "approved",
  };
}

/**
 * Where this renter stands. An approval anywhere in their recent history wins;
 * otherwise the newest submission decides.
 */
export async function getRenterVerificationState(
  db: any,
  userId: string,
): Promise<RenterVerificationState> {
  const { data, error } = await db
    .from(RENTER_VERIFICATION_TABLE)
    .select("id,status,submitted_at,reviewed_at,rejection_reason,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    if (isMissingRenterVerificationTable(error)) {
      console.error(
        "[renter-verification] table missing: run db/patch_renter_verifications.sql. Booking gate is OFF until then.",
      );
      return buildState({ status: "unverified", available: false });
    }
    throw error;
  }

  const rows = (data ?? []) as any[];
  const row = rows.find((item) => item.status === "approved") ?? rows[0];
  if (!row) return buildState({ status: "unverified", available: true });

  const status: RenterVerificationStatus =
    row.status === "approved" || row.status === "rejected"
      ? row.status
      : "pending";
  return buildState({
    status,
    available: true,
    verificationId: String(row.id),
    submittedAt: row.submitted_at ?? row.created_at ?? null,
    reviewedAt: row.reviewed_at ?? null,
    rejectionReason:
      status === "rejected" ? (row.rejection_reason ?? null) : null,
  });
}

/** The shape the website and both apps read. */
export function renterVerificationDto(state: RenterVerificationState) {
  return {
    status: state.status,
    required: state.required,
    canBook: state.canBook,
    submittedAt: state.submittedAt,
    reviewedAt: state.reviewedAt,
    rejectionReason: state.rejectionReason,
  };
}

// Shown inside app error messages, so it must be a real public address even
// when the server runs against a local or preview URL.
const CONFIGURED_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? process.env.EMAIL_BASE_URL ?? "";
const SITE_HOST = (
  CONFIGURED_SITE_URL.startsWith("https://")
    ? CONFIGURED_SITE_URL
    : "https://hayamegh.com"
)
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

// Kept short and free of "://": the apps and the website only show server
// messages that look like plain sentences (see client-errors.ts).
export function renterVerificationBlockMessage(
  status: RenterVerificationStatus,
) {
  switch (status) {
    case "pending":
      return "Your identity check is still being reviewed. You can book as soon as it is approved. We will email you.";
    case "rejected":
      return `Your identity check was not approved. Send new photos in the app or at ${SITE_HOST}/verify, then book again.`;
    default:
      return `Verify your identity before booking. Update the app or go to ${SITE_HOST}/verify to send your face photo and driving licence.`;
  }
}

/**
 * Returns a 403 response when this renter may not book yet, or null when they
 * may. Call it before creating or refreshing a hold; never after money has
 * moved (finalize and the webhook must not be gated).
 */
export async function requireVerifiedRenter(db: any, userId: string) {
  const state = await getRenterVerificationState(db, userId);
  if (state.canBook) return null;
  return NextResponse.json(
    {
      message: renterVerificationBlockMessage(state.status),
      code: "verification_required",
      verificationStatus: state.status,
    },
    { status: 403 },
  );
}

type ReviewInput = {
  admin: any;
  verificationId: string;
  action: "approve" | "reject";
  rejectionReason?: string | null;
  actor: AdminIdentity;
};

export type ReviewOutcome =
  | { outcome: "approved" | "rejected"; userId: string }
  | { outcome: "not_found" | "stale" };

/** Admin decision on a submission: updates the row, the profile badge, then tells the renter. */
export async function reviewRenterVerification({
  admin,
  verificationId,
  action,
  rejectionReason,
  actor,
}: ReviewInput): Promise<ReviewOutcome> {
  const { data: row } = await admin
    .from(RENTER_VERIFICATION_TABLE)
    .select("id,user_id,status")
    .eq("id", verificationId)
    .maybeSingle();
  if (!row) return { outcome: "not_found" };

  const userId = String(row.user_id);
  const previousStatus = String(row.status);
  const nextStatus = action === "approve" ? "approved" : "rejected";
  if (previousStatus === nextStatus) return { outcome: "stale" };

  const reason =
    action === "reject"
      ? rejectionReason?.trim() ||
        "The photos were not clear enough to verify. Please retake them."
      : null;
  const nowIso = new Date().toISOString();

  // Guarded on the status we read, so two admins deciding at once cannot both
  // win (and the renter cannot be emailed two different outcomes).
  const { data: updated, error: updateError } = await admin
    .from(RENTER_VERIFICATION_TABLE)
    .update({
      status: nextStatus,
      reviewed_at: nowIso,
      reviewed_by: actor.email,
      rejection_reason: reason,
      updated_at: nowIso,
    })
    .eq("id", verificationId)
    .eq("status", previousStatus)
    .select("id")
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updated) return { outcome: "stale" };

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name,is_host")
    .eq("id", userId)
    .maybeSingle();
  const renterName = (profile as any)?.full_name ?? null;

  // Keep the profile's "ID verified" badge in step. A host's badge came from
  // their host application, so revoking a renter approval leaves it alone.
  if (action === "approve") {
    await admin.from("profiles").update({ id_verified: true }).eq("id", userId);
    // Approving an older submission settles any newer one still in the queue.
    await admin
      .from(RENTER_VERIFICATION_TABLE)
      .update({
        status: "approved",
        reviewed_at: nowIso,
        reviewed_by: actor.email,
        updated_at: nowIso,
      })
      .eq("user_id", userId)
      .eq("status", "pending")
      .neq("id", verificationId);
  } else if (previousStatus === "approved" && !(profile as any)?.is_host) {
    await admin.from("profiles").update({ id_verified: false }).eq("id", userId);
  }

  await logAdminAction({
    action:
      action === "approve"
        ? "renter_verification_approved"
        : "renter_verification_rejected",
    summary:
      action === "approve"
        ? `${actor.name} approved the renter verification of ${renterName ?? userId.slice(0, 8).toUpperCase()}`
        : `${actor.name} rejected the renter verification of ${renterName ?? userId.slice(0, 8).toUpperCase()}`,
    targetType: "renter_verification",
    targetId: verificationId,
    metadata: { user_id: userId, ...(reason ? { reason } : {}) },
    actor,
  });

  try {
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email ?? null;
    if (email) {
      await sendEmailSafe({
        to: email,
        ...buildRenterVerificationDecisionEmail({
          approved: action === "approve",
          renterName,
          reason,
        }),
        idempotencyKey: `renter-verification:${verificationId}:${nextStatus}`,
      });
    }
  } catch (emailError) {
    console.error("[renter-verification] decision email failed", emailError);
  }

  try {
    await sendPushNotificationsToUsers({
      adminClient: admin,
      userIds: [userId],
      title: action === "approve" ? "You're verified" : "Verification needs new photos",
      body:
        action === "approve"
          ? "Your identity check is approved. You can book a car now."
          : "We could not approve your photos. Open Hayame to send new ones.",
      collapseId: `renter-verification:${verificationId}`,
      preferenceKey: "account_security",
      notificationCategory: "account_security",
      data: {
        type: "renter_verification",
        status: nextStatus,
        verificationId,
      },
    });
  } catch (pushError) {
    console.error("[renter-verification] decision push failed", pushError);
  }

  return { outcome: nextStatus, userId };
}
