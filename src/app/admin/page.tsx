import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
      .select("user_id")
      .eq("id", applicationId)
      .single();

    const userId = (application as { user_id?: string } | null)?.user_id;
    if (userId) {
      await admin
        .from("profiles")
        .update({ is_host: true, host_approved_at: new Date().toISOString() })
        .eq("id", userId);
    }

    await admin
      .from("host_applications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewer,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);
  }

  if (action === "reject") {
    await admin
      .from("host_applications")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewer,
        rejection_reason: rejectionReason || "Rejected by admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);
  }

  redirect("/admin");
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { error?: string };
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

  const { data: applications } = await admin
    .from("host_applications")
    .select(
      "id,full_name,phone,city,experience,fleet_size,message,status,created_at,reviewed_at,rejection_reason, profiles:profiles!host_applications_user_id_fkey(full_name,avatar_url,phone,city)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Admin</p>
          <h1 className="text-2xl font-semibold text-foreground">Platform overview</h1>
        </div>
        <form action={logoutAction}>
          <button className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-gray-700">
            Sign out
          </button>
        </form>
      </div>

      <AdminTabs
        overview={
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
        }
        applications={
          <Card className="mt-0">
            <CardHeader>
              <CardTitle>Host applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:hidden">
                {applications?.map((app: any) => (
                  <div key={app.id} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{app.full_name}</p>
                        <p className="text-xs text-gray-600">{app.profiles?.full_name ?? "User"}</p>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                        {app.status}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-gray-600">
                      <div>City: {app.city ?? app.profiles?.city ?? "—"}</div>
                      <div>Phone: {app.phone ?? app.profiles?.phone ?? "—"}</div>
                      <div>Fleet size: {typeof app.fleet_size === "number" ? app.fleet_size : "—"}</div>
                      <div>Experience: {app.experience ?? "—"}</div>
                      <div>Notes: {app.message ?? "—"}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {app.created_at ? new Date(app.created_at).toLocaleDateString() : "—"}
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
                      <TableHead>City</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Fleet</TableHead>
                      <TableHead>Experience</TableHead>
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
                          <div className="font-semibold">{app.full_name}</div>
                          <div className="text-xs text-gray-600">{app.profiles?.full_name ?? "User"}</div>
                        </TableCell>
                        <TableCell>{app.city ?? app.profiles?.city ?? "—"}</TableCell>
                        <TableCell>{app.phone ?? app.profiles?.phone ?? "—"}</TableCell>
                        <TableCell>{typeof app.fleet_size === "number" ? app.fleet_size : "—"}</TableCell>
                        <TableCell className="text-xs text-gray-600">{app.experience ?? "—"}</TableCell>
                        <TableCell className="text-sm font-semibold">{app.status}</TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {app.created_at ? new Date(app.created_at).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">{app.message ?? "—"}</TableCell>
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
                        <TableCell colSpan={9} className="text-center text-sm text-gray-600">
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
