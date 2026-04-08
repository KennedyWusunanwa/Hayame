import { buildHostApplicationDecisionEmail, sendEmailSafe } from "@/lib/email";
import { sendPushNotificationsToUsers } from "@/lib/push";

type ReviewHostApplicationInput = {
  admin: any;
  applicationId: string;
  action: "approve" | "reject";
  rejectionReason?: string | null;
  reviewer: string;
};

export async function reviewHostApplication({
  admin,
  applicationId,
  action,
  rejectionReason,
  reviewer,
}: ReviewHostApplicationInput) {
  const normalizedReason = rejectionReason?.trim() || "Rejected by admin";

  if (action === "approve") {
    const { data: application } = await admin
      .from("host_applications")
      .select("user_id,full_name,phone")
      .eq("id", applicationId)
      .single();

    const userId = (application as { user_id?: string } | null)?.user_id;
    const hostPhone =
      (application as { phone?: string | null } | null)?.phone ?? null;
    const hostName =
      (application as { full_name?: string | null } | null)?.full_name ??
      "Host";

    if (userId) {
      await admin.from("profiles").upsert(
        {
          id: userId,
          full_name: hostName,
          phone: hostPhone,
          is_host: true,
          host_approved_at: new Date().toISOString(),
          id_verified: true,
          phone_verified: Boolean(hostPhone),
          email_verified: true,
          host_level: "verified_host",
        },
        { onConflict: "id" },
      );
    }

    await admin
      .from("host_applications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    await admin.from("admin_actions").insert({
      action: "host_application_approved",
      target_id: applicationId,
      target_type: "host_application",
      performed_by: reviewer,
      metadata: { user_id: userId },
    });

    if (userId) {
      const { data: authUser } = await admin.auth.admin.getUserById(userId);
      const email = authUser?.user?.email ?? null;

      if (email) {
        const template = buildHostApplicationDecisionEmail({
          approved: true,
          hostName,
        });

        await sendEmailSafe({
          to: email,
          ...template,
          idempotencyKey: `host-application:${applicationId}:approved`,
        });
      }

      try {
        const pushResult = await sendPushNotificationsToUsers({
          adminClient: admin,
          userIds: [userId],
          title: "Host application approved",
          body: "Your host application is approved. You can now list cars and host trips.",
          collapseId: `host-application:${applicationId}`,
          preferenceKey: "account_security",
          notificationCategory: "account_security",
          data: {
            type: "host_application",
            status: "approved",
            applicationId,
          },
        });

        if (pushResult.skipped || pushResult.delivered === 0) {
          console.warn(
            "[admin] host approval push skipped or undelivered",
            pushResult,
          );
        }
      } catch (pushError) {
        console.error("[admin] host approval push failed", pushError);
      }
    }

    return { status: "approved" as const, userId };
  }

  await admin
    .from("host_applications")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewer,
      rejection_reason: normalizedReason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  await admin.from("admin_actions").insert({
    action: "host_application_rejected",
    target_id: applicationId,
    target_type: "host_application",
    performed_by: reviewer,
    metadata: { reason: normalizedReason },
  });

  const { data: application } = await admin
    .from("host_applications")
    .select("user_id,full_name")
    .eq("id", applicationId)
    .single();

  const userId = (application as { user_id?: string } | null)?.user_id;
  const hostName =
    (application as { full_name?: string | null } | null)?.full_name ?? "Host";

  if (userId) {
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email ?? null;

    if (email) {
      const template = buildHostApplicationDecisionEmail({
        approved: false,
        hostName,
        reason: normalizedReason,
      });

      await sendEmailSafe({
        to: email,
        ...template,
        idempotencyKey: `host-application:${applicationId}:rejected`,
      });
    }

    try {
      const pushResult = await sendPushNotificationsToUsers({
        adminClient: admin,
        userIds: [userId],
        title: "Host application rejected",
        body: `Your host application was rejected. Reason: ${normalizedReason}`,
        collapseId: `host-application:${applicationId}`,
        preferenceKey: "account_security",
        notificationCategory: "account_security",
        data: {
          type: "host_application",
          status: "rejected",
          applicationId,
          reason: normalizedReason,
        },
      });

      if (pushResult.skipped || pushResult.delivered === 0) {
        console.warn(
          "[admin] host rejection push skipped or undelivered",
          pushResult,
        );
      }
    } catch (pushError) {
      console.error("[admin] host rejection push failed", pushError);
    }
  }

  return { status: "rejected" as const, userId };
}
