import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
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
import { reviewHostApplication } from "@/lib/admin-host-applications";
import { getAdminReviewerName, requireAdminPage } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function parseNullableString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function parseDateTimeInput(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function toDateTimeLocalInput(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

async function updateUserAction(formData: FormData) {
  "use server";
  await requireAdminPage();

  const admin = createSupabaseAdminClient() as any;
  const reviewer = getAdminReviewerName();
  const userId = String(formData.get("user_id") ?? "").trim();
  if (!userId) redirect("/admin");

  try {
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("host_approved_at")
      .eq("id", userId)
      .maybeSingle();

    const isHost = formData.get("is_host") === "on";
    const idVerified = formData.get("id_verified") === "on";
    const phoneVerified = formData.get("phone_verified") === "on";
    const emailVerified = formData.get("email_verified") === "on";

    const hostLevelRaw = String(formData.get("host_level") ?? "").trim();
    const allowedHostLevels = new Set([
      "new_host",
      "verified_host",
      "top_host",
      "super_host",
    ]);
    const hostLevel = allowedHostLevels.has(hostLevelRaw)
      ? hostLevelRaw
      : isHost
        ? "verified_host"
        : "new_host";

    const hostApprovedInput = parseNullableString(
      formData.get("host_approved_at"),
    );
    let hostApprovedAt = parseDateTimeInput(hostApprovedInput);
    if (isHost && !hostApprovedAt) {
      hostApprovedAt =
        existingProfile?.host_approved_at ?? new Date().toISOString();
    }

    const profilePayload = {
      first_name: parseNullableString(formData.get("first_name")),
      last_name: parseNullableString(formData.get("last_name")),
      full_name: parseNullableString(formData.get("full_name")),
      avatar_url: parseNullableString(formData.get("avatar_url")),
      phone: parseNullableString(formData.get("phone")),
      city: parseNullableString(formData.get("city")),
      region: parseNullableString(formData.get("region")),
      is_host: isHost,
      host_level: hostLevel,
      host_approved_at: isHost ? hostApprovedAt : null,
      id_verified: idVerified,
      phone_verified: phoneVerified,
      email_verified: emailVerified,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await admin
      .from("profiles")
      .update(profilePayload)
      .eq("id", userId);
    if (profileError) throw profileError;

    const email = parseNullableString(formData.get("email"));
    if (email) {
      const { error: authError } = await admin.auth.admin.updateUserById(
        userId,
        { email },
      );
      if (authError) throw authError;
    }

    const applicationId = String(formData.get("application_id") ?? "").trim();
    if (applicationId) {
      const appStatusRaw = String(
        formData.get("application_status") ?? "",
      ).trim();
      const allowedStatuses = new Set(["pending", "approved", "rejected"]);
      const appStatus = allowedStatuses.has(appStatusRaw) ? appStatusRaw : null;
      const rejectionReason = parseNullableString(
        formData.get("application_rejection_reason"),
      );

      const applicationPayload: Record<string, unknown> = {
        id_type: parseNullableString(formData.get("application_id_type")),
        id_number: parseNullableString(formData.get("application_id_number")),
        region: parseNullableString(formData.get("application_region")),
        city: parseNullableString(formData.get("application_city")),
        phone: parseNullableString(formData.get("application_phone")),
        experience: parseNullableString(formData.get("application_experience")),
        note: parseNullableString(formData.get("application_note")),
        fleet_size: (() => {
          const raw = parseNullableString(
            formData.get("application_fleet_size"),
          );
          if (!raw) return null;
          const parsed = Number(raw);
          return Number.isFinite(parsed) ? parsed : null;
        })(),
        updated_at: new Date().toISOString(),
      };

      if (appStatus) {
        applicationPayload.status = appStatus;
        if (appStatus === "pending") {
          applicationPayload.reviewed_at = null;
          applicationPayload.reviewed_by = null;
          applicationPayload.rejection_reason = null;
        } else {
          applicationPayload.reviewed_at = new Date().toISOString();
          applicationPayload.reviewed_by = reviewer;
          applicationPayload.rejection_reason =
            appStatus === "rejected"
              ? (rejectionReason ?? "Rejected by admin")
              : null;
        }
      } else if (rejectionReason) {
        applicationPayload.rejection_reason = rejectionReason;
      }

      const { error: applicationError } = await admin
        .from("host_applications")
        .update(applicationPayload)
        .eq("id", applicationId)
        .eq("user_id", userId);
      if (applicationError) throw applicationError;
    }

    await admin.from("admin_actions").insert({
      action: "user_profile_updated",
      target_id: userId,
      target_type: "profile",
      performed_by: reviewer,
      metadata: {
        application_id: applicationId || null,
      },
    });

    redirect(`/admin/users/${userId}?saved=1`);
  } catch (error: any) {
    const message = encodeURIComponent(error?.message ?? "Unable to save user");
    redirect(`/admin/users/${userId}?error=${message}`);
  }
}

async function reviewUserHostApplicationAction(formData: FormData) {
  "use server";
  await requireAdminPage();

  const reviewer = getAdminReviewerName();
  const userId = String(formData.get("user_id") ?? "").trim();
  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();
  const rejectionReason = parseNullableString(formData.get("rejectionReason"));

  if (!userId || !applicationId || !["approve", "reject"].includes(action)) {
    redirect(userId ? `/admin/users/${userId}` : "/admin");
  }

  const admin = createSupabaseAdminClient() as any;

  try {
    await reviewHostApplication({
      admin,
      applicationId,
      action: action as "approve" | "reject",
      rejectionReason,
      reviewer,
    });
    redirect(
      `/admin/users/${userId}?notice=${action === "approve" ? "host-approved" : "host-rejected"}#host-application`,
    );
  } catch (error: any) {
    const message = encodeURIComponent(
      error?.message ?? "Unable to review host application",
    );
    redirect(`/admin/users/${userId}?error=${message}#host-application`);
  }
}

export default async function AdminUserDetailsPage({
  params,
  searchParams,
}: {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?:
    | { saved?: string; error?: string; notice?: string }
    | Promise<{ saved?: string; error?: string; notice?: string }>;
}) {
  await requireAdminPage();
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const userId = resolvedParams.id;

  const admin = createSupabaseAdminClient() as any;

  const [
    profileResult,
    authUserResult,
    hostApplicationsResult,
    carsResult,
    renterBookingsResult,
    conversationsResult,
  ] = await Promise.all([
    admin.from("profiles").select("*").eq("id", userId).maybeSingle(),
    admin.auth.admin.getUserById(userId),
    admin
      .from("host_applications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("cars")
      .select("id,title,city,region,daily_price,approval_status,created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("bookings")
      .select(
        "id,car_id,start_date,end_date,status,total_price,created_at,cars(title)",
      )
      .eq("renter_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("conversations")
      .select(
        "id,host_id,user_id,car_id,last_message_at,last_message_preview,created_at",
      )
      .or(`host_id.eq.${userId},user_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const profile = profileResult.data;
  const authUser = authUserResult?.data?.user ?? null;
  const hostApplications = hostApplicationsResult.data ?? [];
  const cars = carsResult.data ?? [];
  const renterBookings = renterBookingsResult.data ?? [];
  const conversations = conversationsResult.data ?? [];

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>User not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>No profile exists for this user id: {userId}</p>
            <Link
              href="/admin"
              className="inline-flex rounded-md border border-border px-3 py-2 font-semibold text-brand"
            >
              Back to admin
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latestApplication = hostApplications[0] ?? null;
  const carIds = cars.map((car: any) => car.id);
  const { data: ownerBookings } =
    carIds.length > 0
      ? await admin
          .from("bookings")
          .select(
            "id,car_id,start_date,end_date,status,total_price,created_at,cars(title)",
          )
          .in("car_id", carIds)
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [] };

  const idFrontUrl = latestApplication?.id_front_path
    ? `/api/host-applications/${latestApplication.id}/files?type=front`
    : null;
  const idBackUrl = latestApplication?.id_back_path
    ? `/api/host-applications/${latestApplication.id}/files?type=back`
    : null;
  const faceUrl = profile.avatar_url ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">Admin</p>
          <h1 className="text-2xl font-semibold text-foreground">
            User details
          </h1>
        </div>
        <Link
          href="/admin"
          className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-gray-700"
        >
          Back to admin
        </Link>
      </div>

      {resolvedSearch?.saved ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          User profile updated successfully.
        </div>
      ) : null}
      {resolvedSearch?.notice === "host-approved" ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Host application approved.
        </div>
      ) : null}
      {resolvedSearch?.notice === "host-rejected" ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Host application rejected.
        </div>
      ) : null}
      {resolvedSearch?.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {resolvedSearch.error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Account summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[auto,1fr]">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-border bg-gray-100">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name ?? "User"}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-600">
                No photo
              </div>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Name
              </p>
              <p className="font-semibold text-foreground">
                {profile.full_name ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Email
              </p>
              <p className="font-semibold text-foreground">
                {authUser?.email ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Phone
              </p>
              <p className="font-semibold text-foreground">
                {profile.phone ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Role
              </p>
              <p className="font-semibold text-foreground">
                {profile.is_host ? "Host" : "Guest"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Host level
              </p>
              <p className="font-semibold text-foreground">
                {profile.host_level ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Host approved at
              </p>
              <p className="font-semibold text-foreground">
                {formatDateTime(profile.host_approved_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification evidence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded-full px-2 py-1 font-semibold ${profile.id_verified ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}
            >
              ID verified: {profile.id_verified ? "Yes" : "No"}
            </span>
            <span
              className={`rounded-full px-2 py-1 font-semibold ${profile.phone_verified ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}
            >
              Phone verified: {profile.phone_verified ? "Yes" : "No"}
            </span>
            <span
              className={`rounded-full px-2 py-1 font-semibold ${profile.email_verified ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}
            >
              Email verified: {profile.email_verified ? "Yes" : "No"}
            </span>
            <span
              className={`rounded-full px-2 py-1 font-semibold ${profile.is_host ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
            >
              Host active: {profile.is_host ? "Yes" : "No"}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold text-gray-500">Face photo</p>
              {faceUrl ? (
                <img
                  src={faceUrl}
                  alt="Face evidence"
                  className="mt-2 h-40 w-full rounded-md object-cover"
                />
              ) : (
                <p className="mt-2 text-sm text-gray-600">
                  No face photo uploaded.
                </p>
              )}
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold text-gray-500">ID front</p>
              {idFrontUrl ? (
                <>
                  <img
                    src={idFrontUrl}
                    alt="ID front"
                    className="mt-2 h-40 w-full rounded-md object-cover"
                  />
                  <a
                    href={idFrontUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-xs font-semibold text-brand"
                  >
                    Open original
                  </a>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-600">
                  No ID front uploaded.
                </p>
              )}
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold text-gray-500">ID back</p>
              {idBackUrl ? (
                <>
                  <img
                    src={idBackUrl}
                    alt="ID back"
                    className="mt-2 h-40 w-full rounded-md object-cover"
                  />
                  <a
                    href={idBackUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-xs font-semibold text-brand"
                  >
                    Open original
                  </a>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-600">
                  No ID back uploaded.
                </p>
              )}
            </div>
          </div>
          {latestApplication ? (
            <p className="text-xs text-gray-600">
              Latest host application:{" "}
              <span className="font-semibold">{latestApplication.status}</span>{" "}
              ({formatDate(latestApplication.created_at)})
            </p>
          ) : (
            <p className="text-xs text-gray-600">
              No host application record found for this user.
            </p>
          )}
        </CardContent>
      </Card>

      {latestApplication ? (
        <Card>
          <CardHeader>
            <CardTitle>Host review actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full px-2 py-1 font-semibold ${
                  latestApplication.status === "approved"
                    ? "bg-emerald-100 text-emerald-700"
                    : latestApplication.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {latestApplication.status}
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-600">
                Submitted {formatDate(latestApplication.created_at)}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Use these quick actions to approve or reject the latest host
              request and send the standard admin updates.
            </p>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <form action={reviewUserHostApplicationAction}>
                <input type="hidden" name="user_id" value={userId} />
                <input
                  type="hidden"
                  name="applicationId"
                  value={latestApplication.id}
                />
                <input type="hidden" name="action" value="approve" />
                <PendingSubmitButton
                  pendingLabel="Approving host..."
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Approve host
                </PendingSubmitButton>
              </form>
              <form
                action={reviewUserHostApplicationAction}
                className="grid flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <input type="hidden" name="user_id" value={userId} />
                <input
                  type="hidden"
                  name="applicationId"
                  value={latestApplication.id}
                />
                <input type="hidden" name="action" value="reject" />
                <input
                  name="rejectionReason"
                  defaultValue={latestApplication.rejection_reason ?? ""}
                  placeholder="Reason for rejection"
                  className={inputClassName}
                />
                <PendingSubmitButton
                  pendingLabel="Rejecting host..."
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Reject host
                </PendingSubmitButton>
              </form>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <form action={updateUserAction} className="space-y-6">
        <input type="hidden" name="user_id" value={userId} />
        <input
          type="hidden"
          name="application_id"
          value={latestApplication?.id ?? ""}
        />

        <Card>
          <CardHeader>
            <CardTitle>Edit personal info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Email (Auth)">
              <input
                name="email"
                defaultValue={authUser?.email ?? ""}
                className={inputClassName}
              />
            </Field>
            <Field label="Full name">
              <input
                name="full_name"
                defaultValue={profile.full_name ?? ""}
                className={inputClassName}
              />
            </Field>
            <Field label="First name">
              <input
                name="first_name"
                defaultValue={profile.first_name ?? ""}
                className={inputClassName}
              />
            </Field>
            <Field label="Last name">
              <input
                name="last_name"
                defaultValue={profile.last_name ?? ""}
                className={inputClassName}
              />
            </Field>
            <Field label="Phone">
              <input
                name="phone"
                defaultValue={profile.phone ?? ""}
                className={inputClassName}
              />
            </Field>
            <Field label="City">
              <input
                name="city"
                defaultValue={profile.city ?? ""}
                className={inputClassName}
              />
            </Field>
            <Field label="Region">
              <input
                name="region"
                defaultValue={profile.region ?? ""}
                className={inputClassName}
              />
            </Field>
            <Field label="Avatar URL">
              <input
                name="avatar_url"
                defaultValue={profile.avatar_url ?? ""}
                className={inputClassName}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit verification and host status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Host level">
              <select
                name="host_level"
                defaultValue={profile.host_level ?? "new_host"}
                className={inputClassName}
              >
                <option value="new_host">new_host</option>
                <option value="verified_host">verified_host</option>
                <option value="top_host">top_host</option>
                <option value="super_host">super_host</option>
              </select>
            </Field>
            <Field label="Host approved at">
              <input
                type="datetime-local"
                name="host_approved_at"
                defaultValue={toDateTimeLocalInput(profile.host_approved_at)}
                className={inputClassName}
              />
            </Field>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                name="is_host"
                defaultChecked={Boolean(profile.is_host)}
              />
              Host account active
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                name="id_verified"
                defaultChecked={Boolean(profile.id_verified)}
              />
              ID verified
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                name="phone_verified"
                defaultChecked={Boolean(profile.phone_verified)}
              />
              Phone verified
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-gray-50 px-3 py-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                name="email_verified"
                defaultChecked={Boolean(profile.email_verified)}
              />
              Email verified
            </label>
          </CardContent>
        </Card>

        <Card id="host-application" className="scroll-mt-6">
          <CardHeader>
            <CardTitle>Edit host application</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Application status">
              <select
                name="application_status"
                defaultValue={latestApplication?.status ?? "pending"}
                className={inputClassName}
                disabled={!latestApplication}
              >
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </Field>
            <Field label="Application phone">
              <input
                name="application_phone"
                defaultValue={latestApplication?.phone ?? ""}
                className={inputClassName}
                disabled={!latestApplication}
              />
            </Field>
            <Field label="Application region">
              <input
                name="application_region"
                defaultValue={latestApplication?.region ?? ""}
                className={inputClassName}
                disabled={!latestApplication}
              />
            </Field>
            <Field label="Application city">
              <input
                name="application_city"
                defaultValue={latestApplication?.city ?? ""}
                className={inputClassName}
                disabled={!latestApplication}
              />
            </Field>
            <Field label="ID type">
              <input
                name="application_id_type"
                defaultValue={latestApplication?.id_type ?? ""}
                className={inputClassName}
                disabled={!latestApplication}
              />
            </Field>
            <Field label="ID number">
              <input
                name="application_id_number"
                defaultValue={latestApplication?.id_number ?? ""}
                className={inputClassName}
                disabled={!latestApplication}
              />
            </Field>
            <Field label="Fleet size">
              <input
                type="number"
                name="application_fleet_size"
                defaultValue={latestApplication?.fleet_size ?? ""}
                className={inputClassName}
                disabled={!latestApplication}
              />
            </Field>
            <Field label="Rejection reason">
              <input
                name="application_rejection_reason"
                defaultValue={latestApplication?.rejection_reason ?? ""}
                className={inputClassName}
                disabled={!latestApplication}
              />
            </Field>
            <Field label="Experience">
              <textarea
                name="application_experience"
                defaultValue={latestApplication?.experience ?? ""}
                className="min-h-[96px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:bg-gray-50"
                disabled={!latestApplication}
              />
            </Field>
            <Field label="Notes">
              <textarea
                name="application_note"
                defaultValue={latestApplication?.note ?? ""}
                className="min-h-[96px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:bg-gray-50"
                disabled={!latestApplication}
              />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <PendingSubmitButton
            pendingLabel="Saving user..."
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            Save user changes
          </PendingSubmitButton>
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent listings by this user</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cars.map((car: any) => (
                  <TableRow key={car.id}>
                    <TableCell>{car.title ?? car.id}</TableCell>
                    <TableCell>{car.approval_status ?? "N/A"}</TableCell>
                    <TableCell>
                      {formatCurrency(Number(car.daily_price ?? 0))}
                    </TableCell>
                    <TableCell>{formatDate(car.created_at)}</TableCell>
                  </TableRow>
                ))}
                {cars.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-gray-600">
                      No listings.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings on their listings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(ownerBookings ?? []).map((booking: any) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      {booking.cars?.title ?? booking.car_id}
                    </TableCell>
                    <TableCell>{booking.status}</TableCell>
                    <TableCell>
                      {formatDate(booking.start_date)} -{" "}
                      {formatDate(booking.end_date)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(booking.total_price ?? 0))}
                    </TableCell>
                  </TableRow>
                ))}
                {(ownerBookings ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-gray-600">
                      No bookings found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trips they booked as renter</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renterBookings.map((booking: any) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      {booking.cars?.title ?? booking.car_id}
                    </TableCell>
                    <TableCell>{booking.status}</TableCell>
                    <TableCell>
                      {formatDate(booking.start_date)} -{" "}
                      {formatDate(booking.end_date)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(booking.total_price ?? 0))}
                    </TableCell>
                  </TableRow>
                ))}
                {renterBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-sm text-gray-600">
                      No renter bookings found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conversation</TableHead>
                  <TableHead>Last message</TableHead>
                  <TableHead>Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conversation: any) => (
                  <TableRow key={conversation.id}>
                    <TableCell className="text-xs">
                      {conversation.id}
                      <div className="text-[11px] text-gray-500">
                        {conversation.host_id === userId
                          ? "As host"
                          : "As renter"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDateTime(
                        conversation.last_message_at ?? conversation.created_at,
                      )}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-xs text-gray-600">
                      {conversation.last_message_preview ?? "No preview"}
                    </TableCell>
                  </TableRow>
                ))}
                {conversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-sm text-gray-600">
                      No conversations found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const inputClassName =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}
