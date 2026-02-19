import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildHostApplicationDecisionEmail, sendEmailSafe } from "@/lib/email";
import { getInitials } from "@/lib/utils";

const COOKIE_NAME = "admin_auth";

export const dynamic = "force-dynamic";

function adminToken() {
  const username = process.env.ADMIN_USERNAME ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!username || !password) return null;
  return Buffer.from(`${username}:${password}`).toString("base64");
}

async function isAuthed() {
  const token = adminToken();
  if (!token) return false;
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  return cookie === token;
}

async function requireAdmin() {
  if (!(await isAuthed())) {
    redirect("/admin");
  }
}

async function loginAction(formData: FormData) {
  "use server";
  const token = adminToken();
  if (!token) redirect("/admin?error=missing");

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!username || !password) redirect("/admin?error=invalid");

  if (Buffer.from(`${username}:${password}`).toString("base64") !== token) {
    redirect("/admin?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect("/admin");
}

async function logoutAction() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
  redirect("/admin");
}

async function reviewAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const action = String(formData.get("action") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");
  const rejectionReason = String(formData.get("rejectionReason") ?? "");
  const reviewer = process.env.ADMIN_USERNAME ?? "admin";

  if (!applicationId || !["approve", "reject"].includes(action)) {
    redirect("/admin");
  }

  const admin = createSupabaseAdminClient() as any;
  if (action === "approve") {
    const { data: application } = await admin
      .from("host_applications")
      .select("user_id,full_name,phone")
      .eq("id", applicationId)
      .single();

    const userId = (application as { user_id?: string } | null)?.user_id;
    const hostPhone = (application as { phone?: string | null } | null)?.phone ?? null;
    const hostName = (application as { full_name?: string | null } | null)?.full_name ?? "Host";

    if (userId) {
      await admin
        .from("profiles")
        .upsert(
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
        const template = buildHostApplicationDecisionEmail({ approved: true, hostName });
        await sendEmailSafe({
          to: email,
          ...template,
          idempotencyKey: `host-application:${applicationId}:approved`,
        });
      }
    }
  }

  if (action === "reject") {
    await admin
      .from("host_applications")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer,
        rejection_reason: rejectionReason || "Rejected by admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    await admin.from("admin_actions").insert({
      action: "host_application_rejected",
      target_id: applicationId,
      target_type: "host_application",
      performed_by: reviewer,
      metadata: { reason: rejectionReason || "Rejected by admin" },
    });

    const { data: application } = await admin
      .from("host_applications")
      .select("user_id,full_name")
      .eq("id", applicationId)
      .single();
    const userId = (application as { user_id?: string } | null)?.user_id;
    const hostName = (application as { full_name?: string | null } | null)?.full_name ?? "Host";
    if (userId) {
      const { data: authUser } = await admin.auth.admin.getUserById(userId);
      const email = authUser?.user?.email ?? null;
      if (email) {
        const template = buildHostApplicationDecisionEmail({
          approved: false,
          hostName,
          reason: rejectionReason || "Rejected by admin",
        });
        await sendEmailSafe({
          to: email,
          ...template,
          idempotencyKey: `host-application:${applicationId}:rejected`,
        });
      }
    }
  }

  redirect("/admin");
}

async function deleteListingAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const carId = String(formData.get("carId") ?? "");
  if (!carId) {
    redirect("/admin");
  }

  const admin = createSupabaseAdminClient() as any;
  await admin.from("cars").delete().eq("id", carId);
  await admin.from("admin_actions").insert({
    action: "listing_deleted",
    target_id: carId,
    target_type: "car",
    performed_by: process.env.ADMIN_USERNAME ?? "admin",
  });
  redirect("/admin");
}

async function bulkDeleteListingsAction(formData: FormData) {
  "use server";
  await requireAdmin();

  const carIds = Array.from(
    new Set(
      formData
        .getAll("carIds")
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0),
    ),
  );
  if (carIds.length === 0) {
    redirect("/admin");
  }

  const admin = createSupabaseAdminClient() as any;
  await admin.from("cars").delete().in("id", carIds);
  await admin.from("admin_actions").insert({
    action: "listing_bulk_deleted",
    target_type: "car",
    performed_by: process.env.ADMIN_USERNAME ?? "admin",
    metadata: {
      count: carIds.length,
      car_ids: carIds,
    },
  });
  redirect("/admin");
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { error?: string; status?: string; q?: string };
}) {
  const envReady = Boolean(
    process.env.ADMIN_USERNAME &&
      process.env.ADMIN_PASSWORD &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const authed = await isAuthed();

  if (!envReady) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Admin</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700">
            Set ADMIN_USERNAME, ADMIN_PASSWORD, and SUPABASE_SERVICE_ROLE_KEY in your environment to enable admin
            access.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Admin sign in</CardTitle>
          </CardHeader>
          <CardContent>
            {searchParams?.error ? (
              <p className="mb-3 text-sm text-red-600">Invalid admin credentials.</p>
            ) : null}
            <form className="space-y-4" action={loginAction}>
              <div>
                <label className="text-sm font-semibold text-foreground">Username</label>
                <input
                  name="username"
                  className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground">Password</label>
                <input
                  name="password"
                  type="password"
                  className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  required
                />
              </div>
              <button className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">
                Sign in
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const admin = createSupabaseAdminClient() as any;
  const [{ count: usersCount }, { count: carsCount }, { count: bookingsCount }, { count: pendingCount }] =
    await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("cars").select("id", { count: "exact", head: true }),
      admin.from("bookings").select("id", { count: "exact", head: true }),
      admin.from("host_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

  const statusFilter = searchParams?.status ?? "pending";
  const query = (searchParams?.q ?? "").trim();

  let applicationsQuery = admin
    .from("host_applications")
    .select(
      "id,full_name,phone,region,city,id_type,id_number,id_front_path,id_back_path,note,experience,fleet_size,status,submitted_at,created_at,reviewed_at,rejection_reason, reviewed_by, profiles:profiles!host_applications_user_id_fkey(full_name,avatar_url,phone,city)",
    )
    .order("created_at", { ascending: false });

  if (["pending", "approved", "rejected"].includes(statusFilter)) {
    applicationsQuery = applicationsQuery.eq("status", statusFilter);
  }

  if (query) {
    applicationsQuery = applicationsQuery.or(
      `full_name.ilike.%${query}%,phone.ilike.%${query}%,profiles.full_name.ilike.%${query}%`,
    );
  }

  const { data: applications } = await applicationsQuery;

  const { data: hostApplications } = await admin
    .from("host_applications")
    .select(
      "id,user_id,full_name,phone,city,created_at,profiles:profiles!host_applications_user_id_fkey(full_name,avatar_url,phone,city)",
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  const approvedHosts = new Map<string, any>();
  (hostApplications ?? []).forEach((app: any) => {
    if (!app.user_id || approvedHosts.has(app.user_id)) return;
    approvedHosts.set(app.user_id, app);
  });
  const hosts = Array.from(approvedHosts.values());

  const { data: cars } = await admin
    .from("cars")
    .select("id,title,owner_id,city,region,owner:profiles!cars_owner_id_fkey(full_name,avatar_url,phone)")
    .order("created_at", { ascending: false })
    .limit(50);

  const carIds = (cars ?? []).map((car: any) => car.id);
  const { data: carPhotoRows } =
    carIds.length > 0
      ? await admin.from("car_photos").select("car_id,url").in("car_id", carIds)
      : { data: [] };
  const photosByCar = new Map<string, string[]>();
  (carPhotoRows ?? []).forEach((row: any) => {
    if (!row?.car_id || !row?.url) return;
    if (!photosByCar.has(row.car_id)) photosByCar.set(row.car_id, []);
    photosByCar.get(row.car_id)!.push(row.url);
  });

  const { data: users } = await admin
    .from("profiles")
    .select("id,full_name,avatar_url,phone,city,is_host,host_level")
    .order("full_name", { ascending: true })
    .limit(120);

  const carsByOwner = new Map<string, number>();
  (cars ?? []).forEach((car: any) => {
    if (!car.owner_id) return;
    carsByOwner.set(car.owner_id, (carsByOwner.get(car.owner_id) ?? 0) + 1);
  });
  const { data: bookingRows } =
    carIds.length > 0
      ? await admin.from("bookings").select("car_id,start_date,end_date,status").in("car_id", carIds)
      : { data: [] };

  const { data: blockRows } =
    carIds.length > 0
      ? await admin.from("car_availability").select("car_id,start_date,end_date,available").in("car_id", carIds)
      : { data: [] };

  const bookingsByCar = new Map<string, any[]>();
  (bookingRows ?? []).forEach((row: any) => {
    if (!bookingsByCar.has(row.car_id)) bookingsByCar.set(row.car_id, []);
    bookingsByCar.get(row.car_id)!.push(row);
  });

  const blocksByCar = new Map<string, any[]>();
  (blockRows ?? []).forEach((row: any) => {
    if (!blocksByCar.has(row.car_id)) blocksByCar.set(row.car_id, []);
    blocksByCar.get(row.car_id)!.push(row);
  });

  const { data: auditRows } = await admin
    .from("admin_actions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Admin</p>
          <h1 className="text-2xl font-semibold text-foreground">Platform overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/messages"
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-gray-700"
          >
            Messages
          </Link>
          <Link
            href="/admin/filters"
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-gray-700"
          >
            Manage filters
          </Link>
          <Link
            href="/admin/platform"
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-gray-700"
          >
            Platform controls
          </Link>
          <form action={logoutAction}>
            <button className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-gray-700">
              Sign out
            </button>
          </form>
        </div>
      </div>

      <AdminTabs
        overview={
          <div className="space-y-6">
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="py-5">
                  <p className="text-sm text-gray-600">Total users</p>
                  <p className="text-2xl font-semibold text-foreground">{usersCount ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-5">
                  <p className="text-sm text-gray-600">Total vehicles</p>
                  <p className="text-2xl font-semibold text-foreground">{carsCount ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-5">
                  <p className="text-sm text-gray-600">Total bookings</p>
                  <p className="text-2xl font-semibold text-foreground">{bookingsCount ?? 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-5">
                  <p className="text-sm text-gray-600">Pending applications</p>
                  <p className="text-2xl font-semibold text-foreground">{pendingCount ?? 0}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Approved hosts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(hosts ?? []).map((host: any) => (
                    <div key={host.user_id ?? host.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar
                          src={host.profiles?.avatar_url}
                          name={host.profiles?.full_name ?? host.full_name ?? "Host"}
                          className="h-10 w-10"
                        />
                        <div>
                          <p className="font-semibold text-foreground">
                            {host.profiles?.full_name ?? host.full_name ?? "Host"}
                          </p>
                          <p className="text-xs text-gray-600">{host.profiles?.phone ?? host.phone ?? "No phone"}</p>
                          <p className="text-[11px] text-gray-500">
                            Vehicles: {carsByOwner.get(host.user_id ?? host.id) ?? 0}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{host.profiles?.city ?? host.city ?? "-"}</span>
                    </div>
                  ))}
                  {(hosts ?? []).length === 0 ? (
                    <p className="text-sm text-gray-600">No approved hosts yet.</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-600">Showing profile photos for the latest {users?.length ?? 0} users.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(users ?? []).map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <ProfileAvatar src={user.avatar_url} name={user.full_name ?? "User"} className="h-10 w-10" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{user.full_name ?? "User"}</p>
                          <p className="truncate text-xs text-gray-600">{user.phone ?? "No phone"}</p>
                          <p className="truncate text-[11px] text-gray-500">{user.city ?? "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700">
                          {user.is_host ? "Host" : "Guest"}
                        </span>
                        <Link href={`/admin/messages?user=${user.id}`} className="text-[11px] font-semibold text-brand">
                          Message
                        </Link>
                        <Link href={`/admin/users/${user.id}`} className="text-[11px] font-semibold text-brand">
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                {(users ?? []).length === 0 ? (
                  <p className="text-sm text-gray-600">No users found.</p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vehicles & availability</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={bulkDeleteListingsAction} className="space-y-3">
                  {(cars ?? []).length > 0 ? (
                    <div className="flex flex-col gap-2 rounded-lg border border-border bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-gray-700">
                        Select listings and delete them in one action.
                      </p>
                      <button
                        type="submit"
                        className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete selected
                      </button>
                    </div>
                  ) : null}
                  <div className="space-y-3">
                    {(cars ?? []).map((car: any) => {
                      const bookings = bookingsByCar.get(car.id) ?? [];
                      const blocks = (blocksByCar.get(car.id) ?? []).filter((b: any) => b.available === false);
                      const listingPhotos = photosByCar.get(car.id) ?? [];
                      const previewImage = listingPhotos[0] ?? "/car-placeholder.jpg";
                      return (
                        <div key={car.id} className="rounded-lg border border-border p-3">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                              <label className="mt-1 flex items-center gap-2 text-xs font-semibold text-gray-700">
                                <input type="checkbox" name="carIds" value={car.id} className="h-4 w-4 rounded border-border" />
                                Select
                              </label>
                              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-border">
                                <Image
                                  src={previewImage}
                                  alt={car.title ?? "Listing photo"}
                                  fill
                                  className="object-cover"
                                  sizes="96px"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{car.title}</p>
                                <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                                  <ProfileAvatar
                                    src={car.owner?.avatar_url}
                                    name={car.owner?.full_name ?? "Host"}
                                    className="h-6 w-6"
                                  />
                                  <span className="truncate">
                                    Host: {car.owner?.full_name ?? "Host"} {car.owner?.phone ? `| ${car.owner.phone}` : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{car.city ?? "-"}</span>
                              <Link
                                href={`/admin/cars/${car.id}/preview`}
                                className="rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                Preview
                              </Link>
                              <Link
                                href={`/admin/cars/${car.id}/edit`}
                                className="rounded-md border border-border px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                Edit
                              </Link>
                              <button
                                type="submit"
                                formAction={deleteListingAction}
                                name="carId"
                                value={car.id}
                                className="rounded-md border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            Bookings: {bookings.length} | Host blocks: {blocks.length}
                          </div>
                          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                            {listingPhotos.length > 0 ? (
                              listingPhotos.map((photoUrl: string, index: number) => (
                                <div
                                  key={`${car.id}-photo-${index}`}
                                  className="relative h-12 w-16 shrink-0 overflow-hidden rounded border border-border"
                                >
                                  <Image
                                    src={photoUrl}
                                    alt={`${car.title ?? "Listing"} photo ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                  />
                                </div>
                              ))
                            ) : (
                              <p className="text-[11px] text-gray-500">No photos uploaded yet.</p>
                            )}
                          </div>
                          {bookings.length > 0 ? (
                            <div className="mt-2 text-[11px] text-gray-600">
                              Upcoming bookings:{" "}
                              {bookings
                                .slice(0, 2)
                                .map((b: any) => `${b.start_date} -> ${b.end_date}`)
                                .join(", ")}
                            </div>
                          ) : null}
                          {blocks.length > 0 ? (
                            <div className="mt-1 text-[11px] text-gray-600">
                              Host blocks:{" "}
                              {blocks
                                .slice(0, 2)
                                .map((b: any) => `${b.start_date} -> ${b.end_date}`)
                                .join(", ")}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                    {(cars ?? []).length === 0 ? (
                      <p className="text-sm text-gray-600">No vehicles yet.</p>
                    ) : null}
                  </div>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Admin audit log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {(auditRows ?? []).map((row: any) => (
                    <div key={row.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{row.action}</p>
                        <p className="text-xs text-gray-600">{row.performed_by ?? "admin"}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                      </span>
                    </div>
                  ))}
                  {(auditRows ?? []).length === 0 ? (
                    <p className="text-sm text-gray-600">No admin actions yet.</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform controls</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "Host approvals",
                    note: "Implemented in Applications tab.",
                  },
                  {
                    title: "Listing approvals",
                    note: "Review pending listings and approve/reject from Platform controls.",
                  },
                  {
                    title: "Refund control",
                    note: "Process paid booking refunds and keep an audit trail.",
                  },
                  {
                    title: "Review moderation",
                    note: "Hide/unhide reviews with moderation reasons.",
                  },
                  {
                    title: "Disputes",
                    note: "Track open, under review, resolved, and closed disputes.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-lg border border-border bg-gray-50 p-3">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-gray-700">{item.note}</p>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <Link
                    href="/admin/platform"
                    className="inline-flex rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
                  >
                    Open platform controls
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        }
        applications={
          <Card className="mt-0">
            <CardHeader>
              <CardTitle>Host applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {["pending", "approved", "rejected"].map((status) => (
                  <a
                    key={status}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      statusFilter === status ? "border-brand bg-brand text-white" : "border-border text-gray-700"
                    }`}
                    href={`/admin?status=${status}&q=${encodeURIComponent(query)}`}
                  >
                    {status}
                  </a>
                ))}
                <form className="flex-1 sm:flex-none" action="/admin" method="get">
                  <input type="hidden" name="status" value={statusFilter} />
                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="Search name or phone"
                    className="w-full rounded-md border border-border px-3 py-1 text-xs text-gray-700 sm:w-64"
                  />
                </form>
              </div>

              <div className="space-y-3 md:hidden">
                {applications?.map((app: any) => (
                  <div key={app.id} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <ProfileAvatar
                          src={app.profiles?.avatar_url}
                          name={app.profiles?.full_name ?? app.full_name ?? "User"}
                          className="h-10 w-10"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{app.full_name}</p>
                          <p className="truncate text-xs text-gray-600">{app.profiles?.full_name ?? "User"}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                        {app.status}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-gray-600">
                      <div>Region: {app.region ?? "—"}</div>
                      <div>City: {app.city ?? app.profiles?.city ?? "—"}</div>
                      <div>Phone: {app.phone ?? app.profiles?.phone ?? "—"}</div>
                      <div>ID: {app.id_type ? `${app.id_type} ${app.id_number ?? ""}` : "—"}</div>
                      <div>
                        ID Images:{" "}
                        <a className="text-brand" href={`/api/host-applications/${app.id}/files?type=front`}>
                          Front
                        </a>{" "}
                        /{" "}
                        <a className="text-brand" href={`/api/host-applications/${app.id}/files?type=back`}>
                          Back
                        </a>
                      </div>
                      <div>Fleet size: {typeof app.fleet_size === "number" ? app.fleet_size : "—"}</div>
                      <div>Experience: {app.experience ?? "—"}</div>
                      <div>Notes: {app.note ?? "—"}</div>
                      <div>Reviewed by: {app.reviewed_by ?? "—"}</div>
                      <div>Reject reason: {app.rejection_reason ?? "—"}</div>
                      <div>
                        Reviewed at: {app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : "—"}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {app.submitted_at
                          ? new Date(app.submitted_at).toLocaleDateString()
                          : app.created_at
                            ? new Date(app.created_at).toLocaleDateString()
                            : "—"}
                      </span>
                      {app.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <form action={reviewAction}>
                            <input type="hidden" name="applicationId" value={app.id} />
                            <input type="hidden" name="action" value="approve" />
                            <button className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                              Approve
                            </button>
                          </form>
                          <form action={reviewAction}>
                            <input type="hidden" name="applicationId" value={app.id} />
                            <input type="hidden" name="action" value="reject" />
                            <button className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                              Reject
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {app.status === "approved" ? "Approved" : "Rejected"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {applications?.length === 0 ? (
                  <p className="rounded-xl border border-border bg-white p-4 text-center text-sm text-gray-600">
                    No host applications yet.
                  </p>
                ) : null}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Fleet</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications?.map((app: any) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-3">
                            <ProfileAvatar
                              src={app.profiles?.avatar_url}
                              name={app.profiles?.full_name ?? app.full_name ?? "User"}
                              className="h-10 w-10"
                            />
                            <div className="min-w-0">
                              <div className="truncate font-semibold">{app.full_name}</div>
                              <div className="truncate text-xs text-gray-600">{app.profiles?.full_name ?? "User"}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{app.region ?? "—"}</TableCell>
                        <TableCell>{app.city ?? app.profiles?.city ?? "—"}</TableCell>
                        <TableCell>{app.phone ?? app.profiles?.phone ?? "—"}</TableCell>
                        <TableCell>{typeof app.fleet_size === "number" ? app.fleet_size : "—"}</TableCell>
                        <TableCell className="text-xs text-gray-600">{app.experience ?? "—"}</TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {app.id_type ?? "—"} {app.id_number ?? ""}
                          <div className="mt-1 flex gap-2">
                            <a className="text-brand" href={`/api/host-applications/${app.id}/files?type=front`}>
                              Front
                            </a>
                            <a className="text-brand" href={`/api/host-applications/${app.id}/files?type=back`}>
                              Back
                            </a>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-semibold">{app.status}</TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {app.submitted_at
                            ? new Date(app.submitted_at).toLocaleDateString()
                            : app.created_at
                              ? new Date(app.created_at).toLocaleDateString()
                              : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {app.note ?? "—"}
                          <div className="text-[11px] text-gray-500">Reviewed by: {app.reviewed_by ?? "—"}</div>
                          <div className="text-[11px] text-gray-500">
                            Reject reason: {app.rejection_reason ?? "—"}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            Reviewed at: {app.reviewed_at ? new Date(app.reviewed_at).toLocaleDateString() : "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {app.status === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <form action={reviewAction} className="flex items-center gap-2">
                                <input type="hidden" name="applicationId" value={app.id} />
                                <input type="hidden" name="action" value="approve" />
                                <button className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                                  Approve
                                </button>
                              </form>
                              <form action={reviewAction} className="flex items-center gap-2">
                                <input type="hidden" name="applicationId" value={app.id} />
                                <input type="hidden" name="action" value="reject" />
                                <input
                                  name="rejectionReason"
                                  placeholder="Reason"
                                  className="hidden w-28 rounded-md border border-border px-2 py-1 text-xs text-gray-700 sm:block"
                                />
                                <button className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                                  Reject
                                </button>
                              </form>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">
                              {app.status === "approved" ? "Approved" : "Rejected"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {applications?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center text-sm text-gray-600">
                          No host applications yet.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        }
      />
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
      <div className={`relative shrink-0 overflow-hidden rounded-full border border-border ${className}`}>
        <Image src={src} alt={name ?? "User"} fill className="object-cover" sizes="40px" />
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

