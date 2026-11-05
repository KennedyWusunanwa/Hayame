import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNotice } from "@/components/admin/admin-notice";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/admin/admin-ui";
import { AdminSearchForm } from "@/components/admin/admin-search";
import { matchesQuery } from "@/lib/admin-search";
import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { can } from "@/lib/admin-permissions";
import {
  isMissingNotificationStorageError,
  sanitizeAnnouncementUrl,
} from "@/lib/notifications";
import { resolveCarImage } from "@/lib/car-images";
import {
  sendBroadcastPushNotifications,
  sendPushNotificationsToUsers,
} from "@/lib/push";
import {
  buildListingDecisionEmail,
  sendEmailSafe,
  sendRefundReceiptEmails,
} from "@/lib/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { refundPaystack } from "@/lib/paystack";
import { getInitials } from "@/lib/utils";

function isChecked(formData: FormData, name: string, fallback = false) {
  const value = String(formData.get(name) ?? "")
    .trim()
    .toLowerCase();
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value);
}

function normalizeAnnouncementCategory(raw: FormDataEntryValue | null) {
  return String(raw ?? "")
    .trim()
    .toLowerCase() === "news"
    ? "news"
    : "system";
}

function normalizeAnnouncementDelivery(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (value === "push" || value === "both") return value;
  return "in_app";
}

function normalizeAnnouncementAudience(raw: FormDataEntryValue | null) {
  return String(raw ?? "")
    .trim()
    .toLowerCase() === "authenticated"
    ? "authenticated"
    : "all";
}

function announcementPreferenceKey(category: string) {
  return category === "news" ? "news_announcements" : "account_security";
}

function normalizeDirectPushTarget(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (value === "news") return "news";
  if (value === "system") return "system";
  return "all";
}

function directPushPreferenceKey(target: string) {
  if (target === "news") return "news_announcements";
  if (target === "system") return "account_security";
  return null;
}

function buildAdminPlatformHref(
  params: Record<string, string | number | boolean | null | undefined> = {},
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    query.set(key, String(value));
  }

  const search = query.toString();
  return search ? `/admin/platform?${search}` : "/admin/platform";
}

function redirectToAdminPlatform(
  params: Record<string, string | number | boolean | null | undefined> = {},
) {
  redirect(buildAdminPlatformHref(params));
}

function formatPushReason(reason?: string) {
  switch (reason) {
    case "push-not-configured":
      return "push credentials are not configured yet";
    case "no-device-tokens":
      return "no device tokens are registered yet";
    case "preference-blocked":
      return "all eligible recipients opted out";
    case "admin-client-missing":
      return "the admin database client was unavailable";
    default:
      return reason ? reason.replace(/-/g, " ") : null;
  }
}

function getPlatformNotice(searchParams: {
  notice?: string;
  error?: string;
  delivery?: string;
  attempted?: string;
  delivered?: string;
  reason?: string;
}): {
  tone: "success" | "error" | "info";
  title: string;
  description?: string;
} | null {
  if (searchParams.error === "announcement-invalid") {
    return {
      tone: "error",
      title: "Announcement not published",
      description: "Add a title and a message with at least 8 characters.",
    };
  }

  if (searchParams.error === "announcement-invalid-url") {
    return {
      tone: "error",
      title: "CTA URL was rejected",
      description:
        "Use a valid https://, http://, or Hayame deep-link URL before publishing.",
    };
  }

  if (searchParams.error === "announcement-storage") {
    return {
      tone: "error",
      title: "Announcement storage is not ready",
      description:
        "Apply the latest database migration so the app announcements tables exist.",
    };
  }

  if (searchParams.error === "announcement-save") {
    return {
      tone: "error",
      title: "Announcement save failed",
      description:
        "The announcement could not be saved. Check the platform logs and database setup.",
    };
  }

  if (searchParams.error === "push-message-invalid") {
    return {
      tone: "error",
      title: "Push message not sent",
      description: "Add a title and a message with at least 8 characters.",
    };
  }

  if (searchParams.error === "settings-invalid") {
    return {
      tone: "error",
      title: "Platform fee not saved",
      description: "Enter a fee between 0 and 100 percent.",
    };
  }

  if (searchParams.error === "settings-save") {
    return {
      tone: "error",
      title: "Platform fee not saved",
      description:
        "The platform_settings table could not be updated. Check the database and service role key.",
    };
  }

  switch (searchParams.notice) {
    case "settings-saved":
      return {
        tone: "success",
        title: "Platform fee saved",
        description:
          "New bookings now use the updated fee. An internal confirmation email was sent.",
      };
    case "listing-approved":
      return {
        tone: "success",
        title: "Listing approved",
        description: "The vehicle is now visible as an approved listing.",
      };
    case "listing-rejected":
      return {
        tone: "success",
        title: "Listing rejected",
        description: "The rejection status and reason were saved.",
      };
    case "listing-deleted":
      return {
        tone: "success",
        title: "Listing deleted",
        description: "The listing was removed from the platform.",
      };
    case "booking-refunded":
      return {
        tone: "success",
        title: "Refund processed",
        description: "The booking refund action was saved successfully.",
      };
    case "review-hidden":
      return {
        tone: "success",
        title: "Review hidden",
        description: "The review is now hidden from guests.",
      };
    case "review-restored":
      return {
        tone: "success",
        title: "Review restored",
        description: "The review is visible again.",
      };
    case "dispute-updated":
      return {
        tone: "success",
        title: "Dispute updated",
        description: "The dispute status and resolution note were saved.",
      };
    case "announcement-archived":
      return {
        tone: "success",
        title: "Announcement archived",
        description: "It will stop appearing in the in-app announcements feed.",
      };
    case "announcement-created": {
      const delivery = searchParams.delivery ?? "in_app";
      const attempted = Number(searchParams.attempted ?? "0");
      const delivered = Number(searchParams.delivered ?? "0");
      const reason = formatPushReason(searchParams.reason);

      if (delivery === "in_app") {
        return {
          tone: "success",
          title: "Announcement published",
          description: "The in-app announcement is now live for mobile users.",
        };
      }

      if (!attempted) {
        return {
          tone: "info",
          title: "Announcement saved",
          description: reason
            ? `The announcement was saved, but push delivery was skipped because ${reason}.`
            : "The announcement was saved, but there were no push deliveries to send.",
        };
      }

      return {
        tone: delivered > 0 ? "success" : "info",
        title: "Announcement published",
        description: `Push delivered to ${delivered} of ${attempted} registered device${attempted === 1 ? "" : "s"}${reason ? `; ${reason}.` : "."}`,
      };
    }
    case "push-message-sent": {
      const attempted = Number(searchParams.attempted ?? "0");
      const delivered = Number(searchParams.delivered ?? "0");
      const reason = formatPushReason(searchParams.reason);

      if (!attempted) {
        return {
          tone: "info",
          title: "Push message skipped",
          description: reason
            ? `No push was sent because ${reason}.`
            : "There were no registered devices to send to.",
        };
      }

      return {
        tone: delivered > 0 ? "success" : "info",
        title: "Push message sent",
        description: `Push delivered to ${delivered} of ${attempted} registered device${attempted === 1 ? "" : "s"}${reason ? `; ${reason}.` : "."}`,
      };
    }
    default:
      return null;
  }
}

async function sendDirectPushMessageAction(formData: FormData) {
  "use server";
  const actor = await requireAdmin("announcements.send");
  const admin = createSupabaseAdminClient() as any;

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const target = normalizeDirectPushTarget(formData.get("target"));

  if (!title || body.length < 8) {
    redirectToAdminPlatform({ error: "push-message-invalid" });
  }

  const preferenceKey = directPushPreferenceKey(target);
  const pushResult = await sendBroadcastPushNotifications({
    adminClient: admin,
    title,
    body,
    collapseId: `admin-message:${Date.now()}`,
    preferenceKey,
    notificationCategory: preferenceKey ?? "admin_message",
    data: {
      type: "admin_message",
      title,
      body,
      target,
    },
  });

  await logAdminAction({
    action: "push_message_sent",
    summary: `${actor.name} sent a push message "${title}" to ${target === "all" ? "everyone" : target}`,
    targetType: "mobile_push",
    metadata: {
      title,
      target,
      attempted: pushResult.attempted,
      delivered: pushResult.delivered,
    },
    actor,
  });

  redirectToAdminPlatform({
    notice: "push-message-sent",
    attempted: pushResult.attempted,
    delivered: pushResult.delivered,
    reason: pushResult.reason ?? "",
  });
}

async function createAnnouncementAction(formData: FormData) {
  "use server";
  const actor = await requireAdmin("announcements.send");
  const admin = createSupabaseAdminClient() as any;

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = normalizeAnnouncementCategory(formData.get("category"));
  const delivery = normalizeAnnouncementDelivery(formData.get("delivery"));
  const audience = normalizeAnnouncementAudience(formData.get("audience"));
  const showOnce = isChecked(formData, "showOnce", true);
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim() || null;
  const rawCtaUrl = String(formData.get("ctaUrl") ?? "").trim();
  const ctaUrl = sanitizeAnnouncementUrl(rawCtaUrl);

  if (!title || body.length < 8) {
    redirectToAdminPlatform({ error: "announcement-invalid" });
  }

  if (rawCtaUrl && !ctaUrl) {
    redirectToAdminPlatform({ error: "announcement-invalid-url" });
  }

  const publishedAt = new Date().toISOString();
  const reviewer = actor.email;
  const { data: announcement, error } = await admin
    .from("app_announcements")
    .insert({
      title,
      body,
      category,
      delivery,
      audience,
      show_once: showOnce,
      cta_label: ctaLabel,
      cta_url: ctaUrl,
      published_at: publishedAt,
      created_by: reviewer,
      updated_at: publishedAt,
    })
    .select(
      "id,title,body,category,delivery,audience,show_once,cta_label,cta_url,published_at",
    )
    .single();

  if (error || !announcement?.id) {
    redirectToAdminPlatform({
      error: isMissingNotificationStorageError(error)
        ? "announcement-storage"
        : "announcement-save",
    });
  }

  let pushResult: Awaited<
    ReturnType<typeof sendBroadcastPushNotifications>
  > | null = null;
  if (delivery === "push" || delivery === "both") {
    pushResult = await sendBroadcastPushNotifications({
      adminClient: admin,
      title,
      body,
      collapseId: `announcement:${announcement.id}`,
      preferenceKey: announcementPreferenceKey(category),
      notificationCategory: announcementPreferenceKey(category),
      data: {
        type: "announcement",
        announcementId: announcement.id,
        category,
        ctaUrl: ctaUrl ?? "",
      },
    });
  }

  await logAdminAction({
    action: "announcement_created",
    summary: `${actor.name} published the announcement "${title}" (${delivery}, ${audience})`,
    targetId: announcement.id,
    targetType: "announcement",
    metadata: {
      category,
      delivery,
      audience,
      pushed: Boolean(pushResult),
      delivered: pushResult?.delivered ?? 0,
    },
    actor,
  });

  redirectToAdminPlatform({
    notice: "announcement-created",
    delivery,
    attempted: pushResult?.attempted ?? 0,
    delivered: pushResult?.delivered ?? 0,
    reason: pushResult?.reason ?? "",
  });
}

async function archiveAnnouncementAction(formData: FormData) {
  "use server";
  const actor = await requireAdmin("announcements.send");
  const admin = createSupabaseAdminClient() as any;
  const announcementId = String(formData.get("announcementId") ?? "").trim();
  if (!announcementId) {
    redirectToAdminPlatform();
  }

  const archivedAt = new Date().toISOString();
  await admin
    .from("app_announcements")
    .update({
      archived_at: archivedAt,
      ends_at: archivedAt,
      updated_at: archivedAt,
    })
    .eq("id", announcementId);

  await logAdminAction({
    action: "announcement_archived",
    summary: `${actor.name} archived an announcement`,
    targetId: announcementId,
    targetType: "announcement",
    actor,
  });

  redirectToAdminPlatform({ notice: "announcement-archived" });
}

function parseFeePercent(raw: FormDataEntryValue | null) {
  const value = Number(String(raw ?? "").trim());
  if (!Number.isFinite(value)) return null;
  return Math.round(Math.min(Math.max(value, 0), 100) * 100) / 100;
}

async function updatePlatformSettingsAction(formData: FormData) {
  "use server";
  const actor = await requireAdmin("platform.fee");
  const admin = createSupabaseAdminClient() as any;
  const nextFee = parseFeePercent(formData.get("platformFeePercent"));
  if (nextFee === null) {
    redirectToAdminPlatform({ error: "settings-invalid" });
    return;
  }

  const { data: current } = await admin
    .from("platform_settings")
    .select("platform_fee_percent")
    .eq("id", 1)
    .maybeSingle();
  const previousFee =
    current?.platform_fee_percent === null ||
    current?.platform_fee_percent === undefined
      ? null
      : Number(current.platform_fee_percent);

  const changedAt = new Date().toISOString();
  const { error } = await admin.from("platform_settings").upsert(
    {
      id: 1,
      platform_fee_percent: nextFee,
      updated_at: changedAt,
    },
    { onConflict: "id" },
  );
  if (error) {
    console.error("[admin] platform settings update failed", error);
    redirectToAdminPlatform({ error: "settings-save" });
    return;
  }

  if (previousFee !== nextFee) {
    await logAdminAction({
      action: "platform_settings_updated",
      summary: `${actor.name} changed the platform fee from ${previousFee === null ? "unset" : `${previousFee}%`} to ${nextFee}%`,
      targetType: "platform_settings",
      metadata: { previous_fee_percent: previousFee ?? "unset", new_fee_percent: nextFee },
      actor,
    });
  }

  redirectToAdminPlatform({ notice: "settings-saved" });
}

async function listingReviewAction(formData: FormData) {
  "use server";
  const actor = await requireAdmin("vehicles.review");
  const admin = createSupabaseAdminClient() as any;
  const carId = String(formData.get("carId") ?? "");
  const action = String(formData.get("action") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!carId || !["approve", "reject"].includes(action)) {
    redirectToAdminPlatform();
  }

  const { data: car } = await admin
    .from("cars")
    .select("id,title,owner_id")
    .eq("id", carId)
    .maybeSingle();

  await admin
    .from("cars")
    .update({
      approval_status: action === "approve" ? "approved" : "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: actor.email,
      rejection_reason:
        action === "reject" ? reason || "Rejected by admin" : null,
    })
    .eq("id", carId);

  await logAdminAction({
    action: action === "approve" ? "listing_approved" : "listing_rejected",
    summary: `${actor.name} ${action === "approve" ? "approved" : "rejected"} the listing ${(car as { title?: string | null } | null)?.title ?? carId}`,
    targetId: carId,
    targetType: "car",
    metadata: action === "reject" ? { reason } : null,
    actor,
  });

  // Notify the host that their listing was approved / rejected (email + push).
  const ownerId = (car as { owner_id?: string } | null)?.owner_id ?? null;
  if (ownerId) {
    const carTitle = (car as { title?: string | null } | null)?.title ?? null;
    try {
      const { data: hostAuth } = await admin.auth.admin.getUserById(ownerId);
      const { data: hostProfile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", ownerId)
        .maybeSingle();
      const hostEmail = hostAuth?.user?.email ?? null;
      const hostName =
        (hostProfile as { full_name?: string | null } | null)?.full_name ??
        null;
      if (hostEmail) {
        const email = buildListingDecisionEmail({
          approved: action === "approve",
          hostName,
          carTitle,
          carId,
          reason: action === "reject" ? reason || "Rejected by admin" : null,
        });
        await sendEmailSafe({
          to: hostEmail,
          ...email,
          idempotencyKey: `listing:${carId}:${action}`,
        });
      }
    } catch (emailError) {
      console.error("[admin] listing decision email failed", emailError);
    }

    try {
      await sendPushNotificationsToUsers({
        adminClient: admin,
        userIds: [ownerId],
        title:
          action === "approve" ? "Listing approved" : "Listing needs changes",
        body:
          action === "approve"
            ? `${carTitle ?? "Your listing"} is approved and now live for renters.`
            : `${carTitle ?? "Your listing"} was not approved.${reason ? ` Reason: ${reason}` : ""}`,
        collapseId: `listing:${carId}`,
        preferenceKey: "account_security",
        notificationCategory: "account_security",
        data: {
          type: "listing_status",
          carId: String(carId),
          status: action === "approve" ? "approved" : "rejected",
        },
      });
    } catch (pushError) {
      console.error("[admin] listing decision push failed", pushError);
    }
  }

  redirectToAdminPlatform({
    notice: action === "approve" ? "listing-approved" : "listing-rejected",
  });
}

async function deleteListingAction(formData: FormData) {
  "use server";
  const actor = await requireAdmin("vehicles.delete");
  const admin = createSupabaseAdminClient() as any;
  const carId = String(formData.get("carId") ?? "");
  if (!carId) {
    redirectToAdminPlatform();
  }

  const { data: doomed } = await admin.from("cars").select("title,city").eq("id", carId).maybeSingle();
  await admin.from("cars").delete().eq("id", carId);
  await logAdminAction({
    action: "listing_deleted",
    summary: `${actor.name} deleted the listing ${doomed?.title ?? carId}${doomed?.city ? ` (${doomed.city})` : ""}`,
    targetId: carId,
    targetType: "car",
    actor,
  });

  redirectToAdminPlatform({ notice: "listing-deleted" });
}

async function refundAction(formData: FormData) {
  "use server";
  const actor = await requireAdmin("bookings.refund");
  const admin = createSupabaseAdminClient() as any;
  const bookingId = String(formData.get("bookingId") ?? "");
  const reason =
    String(formData.get("reason") ?? "").trim() || "Refunded by admin";
  if (!bookingId) redirectToAdminPlatform();

  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id,payment_provider,payment_reference,payment_status,renter_id,total_price,start_date,end_date,cars:cars(owner_id,title)",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking || booking.payment_status !== "paid") {
    redirectToAdminPlatform();
  }

  let refundSucceeded = true;
  if (booking.payment_provider === "paystack" && booking.payment_reference) {
    try {
      await refundPaystack(booking.payment_reference);
    } catch (refundError) {
      refundSucceeded = false;
      console.error(
        "[admin] CRITICAL: Paystack refund failed — manual refund required",
        { reference: booking.payment_reference, refundError },
      );
    }
  }

  await admin
    .from("bookings")
    .update({
      status: "refunded",
      payment_status: refundSucceeded ? "refunded" : "refund_failed",
      refund_reference: refundSucceeded ? booking.payment_reference : null,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq("id", bookingId);

  // Official refund receipts to both parties (only when money moved).
  if (refundSucceeded) {
    try {
      const ownerId = (booking as any)?.cars?.owner_id ?? null;
      const [renterAuth, hostAuth, renterProfile, hostProfile] =
        await Promise.all([
          admin.auth.admin.getUserById(booking.renter_id).catch(() => null),
          ownerId
            ? admin.auth.admin.getUserById(ownerId).catch(() => null)
            : null,
          admin
            .from("profiles")
            .select("full_name")
            .eq("id", booking.renter_id)
            .maybeSingle(),
          ownerId
            ? admin
                .from("profiles")
                .select("full_name")
                .eq("id", ownerId)
                .maybeSingle()
            : null,
        ]);
      const authEmail = (r: any) =>
        r?.data?.user?.email ?? r?.user?.email ?? r?.email ?? null;
      await sendRefundReceiptEmails({
        renterEmail: authEmail(renterAuth),
        hostEmail: authEmail(hostAuth),
        renterName: (renterProfile as any)?.data?.full_name ?? null,
        hostName: (hostProfile as any)?.data?.full_name ?? null,
        carTitle: (booking as any)?.cars?.title ?? null,
        bookingId: booking.id,
        paymentReference: booking.payment_reference,
        refundReference: booking.payment_reference,
        refundAmount: Number(booking.total_price ?? 0),
        totalPaid: Number(booking.total_price ?? 0),
        reason,
        startDate: booking.start_date,
        endDate: booking.end_date,
      });
    } catch (emailError) {
      console.error("[admin] refund receipt emails failed", emailError);
    }
  }

  await logAdminAction({
    action: "booking_refunded",
    summary: refundSucceeded
      ? `${actor.name} refunded GH₵${Number(booking.total_price ?? 0).toLocaleString("en-GH")} on booking ${bookingId.slice(0, 8).toUpperCase()}`
      : `REFUND FAILED: ${actor.name} tried to refund booking ${bookingId.slice(0, 8).toUpperCase()}. Refund it manually in Paystack`,
    targetId: bookingId,
    targetType: "booking",
    metadata: { reason, succeeded: refundSucceeded, amount: Number(booking.total_price ?? 0) },
    actor,
  });

  redirectToAdminPlatform({ notice: "booking-refunded" });
}

async function reviewModerationAction(formData: FormData) {
  "use server";
  const actor = await requireAdmin("reviews.moderate");
  const admin = createSupabaseAdminClient() as any;
  const reviewId = String(formData.get("reviewId") ?? "");
  const action = String(formData.get("action") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reviewId || !["hide", "show"].includes(action)) {
    redirectToAdminPlatform();
  }

  await admin
    .from("reviews")
    .update({
      is_hidden: action === "hide",
      moderated_at: new Date().toISOString(),
      moderated_by: actor.email,
      moderation_reason: action === "hide" ? reason || "Hidden by admin" : null,
    })
    .eq("id", reviewId);

  await logAdminAction({
    action: action === "hide" ? "review_hidden" : "review_restored",
    summary: `${actor.name} ${action === "hide" ? "hid" : "restored"} a review`,
    targetId: reviewId,
    targetType: "review",
    metadata: action === "hide" ? { reason } : null,
    actor,
  });

  redirectToAdminPlatform({
    notice: action === "hide" ? "review-hidden" : "review-restored",
  });
}

async function disputeAction(formData: FormData) {
  "use server";
  const actor = await requireAdmin("disputes.resolve");
  const admin = createSupabaseAdminClient() as any;
  const disputeId = String(formData.get("disputeId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (
    !disputeId ||
    !["open", "under_review", "resolved", "closed"].includes(status)
  ) {
    redirectToAdminPlatform();
  }

  await admin
    .from("disputes")
    .update({
      status,
      resolution_note: note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", disputeId);

  await logAdminAction({
    action: "dispute_status_updated",
    summary: `${actor.name} set a dispute to ${status.replace("_", " ")}`,
    targetId: disputeId,
    targetType: "dispute",
    metadata: { status, note },
    actor,
  });

  redirectToAdminPlatform({ notice: "dispute-updated" });
}

export default async function AdminPlatformPage({
  searchParams,
}: {
  searchParams: Promise<{
    notice?: string;
    error?: string;
    delivery?: string;
    attempted?: string;
    delivered?: string;
    reason?: string;
    q?: string;
  }>;
}) {
  const me = await requireAdmin();
  const resolvedSearchParams = await searchParams;
  const admin = createSupabaseAdminClient() as any;
  const notice = getPlatformNotice(resolvedSearchParams);
  const query = (resolvedSearchParams.q ?? "").trim();

  const [
    pendingListings,
    refundableBookings,
    reviews,
    disputes,
    announcements,
    pushTokenRows,
    newsPreferenceRows,
    platformSettingsResult,
  ] = await Promise.all([
    admin
      .from("cars")
      .select(
        "id,title,city,daily_price,approval_status,rejection_reason,owner:profiles!cars_owner_id_fkey(full_name,avatar_url,phone)",
      )
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("bookings")
      .select(
        "id,start_date,end_date,total_price,payment_status,payment_reference,payment_provider,cars(title)",
      )
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("reviews")
      .select(
        "id,rating,comment,is_hidden,moderation_reason,created_at,cars(title),profiles:profiles!reviews_user_id_fkey(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("disputes")
      .select(
        "id,booking_id,status,reason,resolution_note,created_at,cars(title)",
      )
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("app_announcements")
      .select(
        "id,title,body,category,delivery,audience,show_once,published_at,archived_at,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("mobile_push_tokens").select("user_id"),
    admin
      .from("user_notification_preferences")
      .select("user_id")
      .eq("news_announcements", true),
    admin
      .from("platform_settings")
      .select("platform_fee_percent,updated_at")
      .eq("id", 1)
      .maybeSingle(),
  ]);

  const storedFeePercent = Number(
    platformSettingsResult?.data?.platform_fee_percent ?? Number.NaN,
  );
  const envFeePercent = Number(
    process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT ??
      process.env.PLATFORM_FEE_PERCENT ??
      "10",
  );
  const effectiveFeePercent = Number.isFinite(storedFeePercent)
    ? storedFeePercent
    : Number.isFinite(envFeePercent)
      ? envFeePercent
      : 10;
  const feeSource = Number.isFinite(storedFeePercent)
    ? "saved in database"
    : "environment fallback, not yet saved";
  const feeUpdatedAt = platformSettingsResult?.data?.updated_at
    ? new Date(platformSettingsResult.data.updated_at).toLocaleString("en-GB", {
        timeZone: "Africa/Accra",
      })
    : null;

  const pendingCarIds = (pendingListings.data ?? []).map((car: any) => car.id);
  const { data: pendingPhotoRows } =
    pendingCarIds.length > 0
      ? await admin
          .from("car_photos")
          .select("car_id,url")
          .in("car_id", pendingCarIds)
      : { data: [] };
  const listingPhotosByCar = new Map<string, string[]>();
  (pendingPhotoRows ?? []).forEach((row: any) => {
    if (!row?.car_id || !row?.url) return;
    if (!listingPhotosByCar.has(row.car_id))
      listingPhotosByCar.set(row.car_id, []);
    listingPhotosByCar.get(row.car_id)!.push(row.url);
  });

  // One search box filters every moderation list on this page. The lists are
  // already in memory (newest 50 each), so matching happens here.
  const visibleListings = (pendingListings.data ?? []).filter((car: any) =>
    matchesQuery(
      query,
      car.title,
      car.city,
      car.daily_price,
      car.owner?.full_name,
      car.owner?.phone,
      car.id,
    ),
  );
  const visibleBookings = (refundableBookings.data ?? []).filter(
    (booking: any) =>
      matchesQuery(
        query,
        booking.cars?.title,
        booking.payment_reference,
        booking.payment_provider,
        booking.start_date,
        booking.end_date,
        booking.total_price,
        booking.id,
      ),
  );
  const visibleReviews = (reviews.data ?? []).filter((review: any) =>
    matchesQuery(
      query,
      review.cars?.title,
      review.profiles?.full_name,
      review.comment,
      review.rating,
      review.moderation_reason,
    ),
  );
  const visibleDisputes = (disputes.data ?? []).filter((dispute: any) =>
    matchesQuery(
      query,
      dispute.cars?.title,
      dispute.reason,
      dispute.status,
      dispute.resolution_note,
      dispute.booking_id,
      dispute.id,
    ),
  );

  const registeredPushUsers = new Set(
    (pushTokenRows.data ?? [])
      .map((row: any) => String(row?.user_id ?? "").trim())
      .filter(Boolean),
  ).size;
  const newsOptInUsers = new Set(
    (newsPreferenceRows.data ?? [])
      .map((row: any) => String(row?.user_id ?? "").trim())
      .filter(Boolean),
  ).size;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Moderation & finance"
        description="Approve listings, handle refunds and disputes, moderate reviews and talk to the app audience. You only see the tools your role allows."
        actions={
          <AdminSearchForm
            action="/admin/platform"
            placeholder="Search listings, bookings, reviews, disputes"
            query={query}
          />
        }
      />

      {query ? (
        <p className="text-sm text-gray-600">
          Matches for “{query}”: {visibleListings.length} listings,{" "}
          {visibleBookings.length} bookings, {visibleReviews.length} reviews,{" "}
          {visibleDisputes.length} disputes.{" "}
          <Link href="/admin/platform" className="font-semibold text-brand">
            Clear search
          </Link>
        </p>
      ) : null}

      {notice ? (
        <AdminNotice
          tone={notice.tone}
          title={notice.title}
          description={notice.description}
        />
      ) : null}

      {can(me.role, "platform.fee") ? (
      <Card>
        <CardHeader>
          <CardTitle>Platform fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                The platform fee is charged to guests on top of the host&apos;s
                daily rate and shown at checkout as a percentage of the trip
                subtotal. Changing it affects new bookings only; paid bookings
                keep the fee they were charged.
              </p>
              <p>
                <span className="font-semibold text-foreground">
                  Current fee: {effectiveFeePercent}%
                </span>{" "}
                <span className="text-xs text-gray-500">
                  ({feeSource}
                  {feeUpdatedAt ? `, last updated ${feeUpdatedAt}` : ""})
                </span>
              </p>
            </div>
            <form
              action={updatePlatformSettingsAction}
              className="flex items-end gap-2"
            >
              <label className="flex flex-col gap-1 text-xs font-semibold text-gray-700">
                Platform fee (%)
                <input
                  name="platformFeePercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  defaultValue={effectiveFeePercent}
                  required
                  className="w-32 rounded-md border border-border px-3 py-2 text-sm font-normal"
                />
              </label>
              <PendingSubmitButton
                pendingLabel="Saving..."
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Save fee
              </PendingSubmitButton>
            </form>
          </div>
        </CardContent>
      </Card>
      ) : null}

      {can(me.role, "vehicles.review") ? (
      <Card>
        <CardHeader>
          <CardTitle>Listing approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-gray-600">
            {visibleListings.length}{" "}
            {visibleListings.length === 1 ? "listing" : "listings"} waiting for
            review{query ? ` matching “${query}”` : ""}.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleListings.map((car: any) => {
              const listingPhotos = listingPhotosByCar.get(car.id) ?? [];
              const previewImage = resolveCarImage(listingPhotos[0], {
                id: car.id,
                title: car.title,
                city: car.city,
                region: car.region,
                carType: car.car_type,
              });

              return (
                <article
                  key={car.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/3] bg-gray-100">
                    <Image
                      src={previewImage}
                      alt={car.title ?? "Listing"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                    <span className="absolute right-3 top-3 rounded-full bg-amber-500/95 px-2 py-1 text-[11px] font-semibold text-white">
                      Pending review
                    </span>
                    <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">
                      {listingPhotos.length}{" "}
                      {listingPhotos.length === 1 ? "photo" : "photos"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {car.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-600">
                        {car.city ?? "Ghana"} · GHS{" "}
                        {Number(car.daily_price ?? 0).toFixed(0)}/day
                      </p>
                    </div>
                    <div className="flex min-w-0 items-center gap-2 text-xs text-gray-600">
                      <ProfileAvatar
                        src={car.owner?.avatar_url}
                        name={car.owner?.full_name ?? "Host"}
                        className="h-6 w-6"
                      />
                      <span className="truncate">
                        {car.owner?.full_name ?? "Host"}
                        {car.owner?.phone ? ` · ${car.owner.phone}` : ""}
                      </span>
                    </div>
                    {listingPhotos.length > 1 ? (
                      <div className="flex gap-1.5 overflow-x-auto pb-1">
                        {listingPhotos.slice(1, 6).map((url: string, idx: number) => (
                          <div
                            key={`${car.id}-thumb-${idx}`}
                            className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md border border-border"
                          >
                            <Image
                              src={url}
                              alt={`${car.title ?? "Listing"} image ${idx + 2}`}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-auto space-y-2 border-t border-border/70 pt-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/cars/${car.id}/preview`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Preview
                        </Link>
                        <form action={listingReviewAction} className="ml-auto">
                          <input type="hidden" name="carId" value={car.id} />
                          <input type="hidden" name="action" value="approve" />
                          <PendingSubmitButton
                            pendingLabel="Approving..."
                            className="rounded-lg bg-brand px-3 py-1.5 text-[11px] font-semibold text-white"
                          >
                            Approve
                          </PendingSubmitButton>
                        </form>
                        <form action={deleteListingAction}>
                          <input type="hidden" name="carId" value={car.id} />
                          <PendingSubmitButton
                            pendingLabel="Deleting..."
                            className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </PendingSubmitButton>
                        </form>
                      </div>
                      <form
                        action={listingReviewAction}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="carId" value={car.id} />
                        <input type="hidden" name="action" value="reject" />
                        <input
                          name="reason"
                          placeholder="Reason for rejection"
                          className="min-w-0 flex-1 rounded-lg border border-border px-2.5 py-1.5 text-xs"
                        />
                        <PendingSubmitButton
                          pendingLabel="Rejecting..."
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white"
                        >
                          Reject
                        </PendingSubmitButton>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {visibleListings.length === 0 ? (
            <p className="rounded-xl border border-border bg-white p-6 text-center text-sm text-gray-600">
              {query
                ? "No pending listings match your search."
                : "No pending listings."}
            </p>
          ) : null}
        </CardContent>
      </Card>
      ) : null}

      {can(me.role, "bookings.refund") ? (
      <Card>
        <CardHeader>
          <CardTitle>Refund control</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Car</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Refund</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleBookings.map((booking: any) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <p className="font-mono text-xs">
                        {booking.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {booking.start_date} - {booking.end_date}
                      </p>
                    </TableCell>
                    <TableCell>{booking.cars?.title ?? "Car"}</TableCell>
                    <TableCell>
                      GHS {Number(booking.total_price ?? 0).toFixed(0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <form
                        action={refundAction}
                        className="flex items-center justify-end gap-2"
                      >
                        <input
                          type="hidden"
                          name="bookingId"
                          value={booking.id}
                        />
                        <input
                          name="reason"
                          placeholder="Reason"
                          className="hidden rounded-md border border-border px-2 py-1 text-xs sm:block"
                        />
                        <PendingSubmitButton
                          pendingLabel="Refunding..."
                          className="rounded-md bg-amber-600 px-3 py-1 text-xs font-semibold text-white"
                        >
                          Refund
                        </PendingSubmitButton>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
                {visibleBookings.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-gray-600"
                    >
                      No paid bookings available for refund.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      ) : null}

      {can(me.role, "reviews.moderate") ? (
      <Card>
        <CardHeader>
          <CardTitle>Review moderation</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Review</TableHead>
                  <TableHead>Car</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleReviews.map((review: any) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <p className="font-semibold">
                        {review.profiles?.full_name ?? "Guest"} -{" "}
                        {review.rating}/5
                      </p>
                      <p className="text-xs text-gray-600">
                        {review.comment ?? "No comment"}
                      </p>
                    </TableCell>
                    <TableCell>{review.cars?.title ?? "Car"}</TableCell>
                    <TableCell>
                      {review.is_hidden ? "Hidden" : "Visible"}
                    </TableCell>
                    <TableCell className="text-right">
                      <form
                        action={reviewModerationAction}
                        className="flex items-center justify-end gap-2"
                      >
                        <input
                          type="hidden"
                          name="reviewId"
                          value={review.id}
                        />
                        <input
                          type="hidden"
                          name="action"
                          value={review.is_hidden ? "show" : "hide"}
                        />
                        {!review.is_hidden ? (
                          <input
                            name="reason"
                            placeholder="Reason"
                            className="hidden rounded-md border border-border px-2 py-1 text-xs sm:block"
                          />
                        ) : null}
                        <PendingSubmitButton
                          pendingLabel={
                            review.is_hidden ? "Restoring..." : "Hiding..."
                          }
                          className="rounded-md border border-border px-3 py-1 text-xs font-semibold"
                        >
                          {review.is_hidden ? "Unhide" : "Hide"}
                        </PendingSubmitButton>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
                {visibleReviews.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-sm text-gray-600"
                    >
                      No reviews yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      ) : null}

      {can(me.role, "disputes.resolve") ? (
      <Card>
        <CardHeader>
          <CardTitle>Disputes</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Car</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleDisputes.map((dispute: any) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-mono text-xs">
                      {dispute.booking_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{dispute.cars?.title ?? "Car"}</TableCell>
                    <TableCell className="text-xs">{dispute.reason}</TableCell>
                    <TableCell>{dispute.status}</TableCell>
                    <TableCell className="text-right">
                      <form
                        action={disputeAction}
                        className="flex items-center justify-end gap-2"
                      >
                        <input
                          type="hidden"
                          name="disputeId"
                          value={dispute.id}
                        />
                        <select
                          name="status"
                          defaultValue={dispute.status}
                          className="rounded-md border border-border px-2 py-1 text-xs"
                        >
                          <option value="open">open</option>
                          <option value="under_review">under_review</option>
                          <option value="resolved">resolved</option>
                          <option value="closed">closed</option>
                        </select>
                        <input
                          name="note"
                          defaultValue={dispute.resolution_note ?? ""}
                          placeholder="Resolution note"
                          className="hidden rounded-md border border-border px-2 py-1 text-xs sm:block"
                        />
                        <PendingSubmitButton
                          pendingLabel="Saving..."
                          className="rounded-md border border-border px-3 py-1 text-xs font-semibold"
                        >
                          Save
                        </PendingSubmitButton>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
                {visibleDisputes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-gray-600"
                    >
                      No disputes opened yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      ) : null}

      {can(me.role, "announcements.send") ? (
      <Card>
        <CardHeader>
          <CardTitle>Mobile announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                Registered devices
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {registeredPushUsers}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Users with at least one mobile push token.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                News opt-ins
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {newsOptInUsers}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Users who allow press releases and announcement pushes.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                Safe delivery
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                `news` respects opt-in
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Use `system` for operational notices and `in_app` for one-time
                launch messages.
              </p>
            </div>
          </div>

          <form
            action={sendDirectPushMessageAction}
            className="space-y-4 rounded-2xl border border-border bg-white p-3 sm:p-4"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-semibold text-foreground">
                  Push message
                </p>
                <p className="text-sm text-gray-600">
                  Send an immediate notification to registered mobile devices.
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                APNs / FCM
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">
                  Title
                </span>
                <input
                  name="title"
                  required
                  maxLength={80}
                  placeholder="Hayame update"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">
                  Recipients
                </span>
                <select
                  name="target"
                  defaultValue="all"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  <option value="all">All registered devices</option>
                  <option value="system">System notices enabled</option>
                  <option value="news">News opt-ins only</option>
                </select>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">
                Message
              </span>
              <textarea
                name="body"
                required
                minLength={8}
                rows={3}
                placeholder="Write the notification users should receive."
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-600">
                Direct pushes do not create an in-app announcement.
              </p>
              <PendingSubmitButton
                pendingLabel="Sending..."
                className="min-h-10 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                Send push
              </PendingSubmitButton>
            </div>
          </form>

          <form
            action={createAnnouncementAction}
            className="space-y-4 rounded-2xl border border-border p-3 sm:p-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">
                  Title
                </span>
                <input
                  name="title"
                  required
                  maxLength={120}
                  placeholder="Platform update"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">
                  Category
                </span>
                <select
                  name="category"
                  defaultValue="system"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  <option value="system">System notice</option>
                  <option value="news">News / press release</option>
                </select>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">
                Message
              </span>
              <textarea
                name="body"
                required
                minLength={8}
                rows={4}
                placeholder="Write the push or in-app message users should see."
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">
                  Delivery
                </span>
                <select
                  name="delivery"
                  defaultValue="in_app"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  <option value="in_app">In-app only</option>
                  <option value="push">Push only</option>
                  <option value="both">Push and in-app</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">
                  Audience
                </span>
                <select
                  name="audience"
                  defaultValue="all"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  <option value="all">All app users</option>
                  <option value="authenticated">Signed-in users only</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-foreground">
                  CTA label
                </span>
                <input
                  name="ctaLabel"
                  maxLength={40}
                  placeholder="Read more"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-foreground">
                CTA URL
              </span>
              <input
                name="ctaUrl"
                placeholder="https://www.hayamegh.com/blog or hayame://messages"
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="showOnce"
                value="true"
                defaultChecked
                className="h-4 w-4 rounded border-border"
              />
              Show only once when opened in-app
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-600">
                `Push` and `both` send immediately. `news` pushes only go to
                users who opted into announcements.
              </p>
              <PendingSubmitButton
                pendingLabel="Publishing..."
                className="min-h-10 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                Publish announcement
              </PendingSubmitButton>
            </div>
          </form>

          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Announcement</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(announcements.data ?? []).map((announcement: any) => {
                  const isArchived = Boolean(announcement.archived_at);
                  return (
                    <TableRow key={announcement.id}>
                      <TableCell>
                        <p className="font-semibold">{announcement.title}</p>
                        <p className="text-xs text-gray-600">
                          {announcement.body}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{announcement.category}</div>
                        <div className="text-gray-500">
                          {announcement.delivery}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {announcement.audience}
                        {announcement.show_once ? " / once" : " / repeat"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {isArchived ? "Archived" : "Active"}
                        <div className="text-gray-500">
                          {announcement.published_at
                            ? new Date(
                                announcement.published_at,
                              ).toLocaleString()
                            : "Draft"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {!isArchived ? (
                          <form action={archiveAnnouncementAction}>
                            <input
                              type="hidden"
                              name="announcementId"
                              value={announcement.id}
                            />
                            <PendingSubmitButton
                              pendingLabel="Archiving..."
                              className="rounded-md border border-border px-3 py-1 text-xs font-semibold"
                            >
                              Archive
                            </PendingSubmitButton>
                          </form>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Archived
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(announcements.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-gray-600"
                    >
                      No mobile announcements published yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      ) : null}
    </div>
  );
}

function ProfileAvatar({
  src,
  name,
  className,
}: {
  src?: string | null;
  name?: string | null;
  className: string;
}) {
  const initials = getInitials(name ?? "User") || "U";

  if (src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full border border-border ${className}`}
      >
        <Image
          src={src}
          alt={name ?? "User"}
          fill
          className="object-cover"
          sizes="40px"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-xs font-semibold text-primary ${className}`}
    >
      {initials}
    </div>
  );
}
