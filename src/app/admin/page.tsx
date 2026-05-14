import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  Bell,
  Car,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { AdminLoadingLink } from "@/components/admin/admin-loading-link";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminReviewerName,
  isAdminAuthConfigured,
  isAdminAuthenticated,
  requireAdminPage,
  signInAdmin,
  signOutAdmin,
} from "@/lib/admin-auth";
import { reviewHostApplication } from "@/lib/admin-host-applications";
import { resolveCarImage } from "@/lib/car-images";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

function buildAdminHref(
  params: Record<string, string | number | boolean | null | undefined> = {},
) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    query.set(key, String(value));
  }

  const search = query.toString();
  return search ? `/admin?${search}` : "/admin";
}

function redirectToAdmin(
  params: Record<string, string | number | boolean | null | undefined> = {},
) {
  redirect(buildAdminHref(params));
}

function getAdminNotice(searchParams: {
  notice?: string;
  count?: string;
}): {
  tone: "success" | "error" | "info";
  title: string;
  description?: string;
} | null {
  switch (searchParams.notice) {
    case "signed-out":
      return {
        tone: "info",
        title: "Signed out",
        description: "Your admin session has ended.",
      };
    case "host-approved":
      return {
        tone: "success",
        title: "Host approved",
        description: "The host application was approved and the user profile was updated.",
      };
    case "host-rejected":
      return {
        tone: "success",
        title: "Host rejected",
        description: "The rejection was saved and the applicant was updated.",
      };
    case "listing-deleted":
      return {
        tone: "success",
        title: "Listing deleted",
        description: "The vehicle listing was removed from the platform.",
      };
    case "listings-deleted": {
      const count = Number(searchParams.count ?? "0");
      return {
        tone: "success",
        title: "Listings deleted",
        description:
          count > 0
            ? `${count} selected listing${count === 1 ? "" : "s"} removed.`
            : "Selected listings were removed.",
      };
    }
    default:
      return null;
  }
}

async function loginAction(formData: FormData) {
  "use server";
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!username || !password) redirectToAdmin({ error: "invalid" });

  const result = await signInAdmin(username, password);
  if (result === "missing") redirectToAdmin({ error: "missing" });
  if (result !== "ok") redirectToAdmin({ error: "invalid" });
  redirectToAdmin();
}

async function logoutAction() {
  "use server";
  await signOutAdmin();
  redirectToAdmin({ notice: "signed-out" });
}

async function reviewAction(formData: FormData) {
  "use server";
  await requireAdminPage();
  const action = String(formData.get("action") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");
  const rejectionReason = String(formData.get("rejectionReason") ?? "");
  const currentTab =
    typeof formData.get("tab") === "string" ? String(formData.get("tab")) : "";
  const reviewer = getAdminReviewerName();

  if (!applicationId || !["approve", "reject"].includes(action)) {
    redirectToAdmin();
  }

  const admin = createSupabaseAdminClient() as any;
  await reviewHostApplication({
    admin,
    applicationId,
    action: action as "approve" | "reject",
    rejectionReason,
    reviewer,
  });

  const currentStatus =
    typeof formData.get("status") === "string"
      ? String(formData.get("status") ?? "")
      : "";
  const currentQuery =
    typeof formData.get("q") === "string" ? String(formData.get("q") ?? "") : "";

  redirectToAdmin({
    notice: action === "approve" ? "host-approved" : "host-rejected",
    tab: currentTab === "applications" ? "applications" : undefined,
    status: currentStatus,
    q: currentQuery,
  });
}

async function deleteListingAction(formData: FormData) {
  "use server";
  await requireAdminPage();
  const carId = String(formData.get("carId") ?? "");
  if (!carId) {
    redirectToAdmin();
  }

  const admin = createSupabaseAdminClient() as any;
  await admin.from("cars").delete().eq("id", carId);
  await admin.from("admin_actions").insert({
    action: "listing_deleted",
    target_id: carId,
    target_type: "car",
    performed_by: getAdminReviewerName(),
  });
  redirectToAdmin({ notice: "listing-deleted" });
}

async function bulkDeleteListingsAction(formData: FormData) {
  "use server";
  await requireAdminPage();

  const carIds = Array.from(
    new Set(
      formData
        .getAll("carIds")
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0),
    ),
  );
  if (carIds.length === 0) {
    redirectToAdmin();
  }

  const admin = createSupabaseAdminClient() as any;
  await admin.from("cars").delete().in("id", carIds);
  await admin.from("admin_actions").insert({
    action: "listing_bulk_deleted",
    target_type: "car",
    performed_by: getAdminReviewerName(),
    metadata: {
      count: carIds.length,
      car_ids: carIds,
    },
  });
  redirectToAdmin({ notice: "listings-deleted", count: carIds.length });
}

type AdminWorkspaceProps = {
  children: ReactNode;
  initialTab: "overview" | "applications";
  pendingCount: number;
  usersCount: number;
  carsCount: number;
  bookingsCount: number;
  statusFilter: string;
  query: string;
};

function AdminWorkspace({
  children,
  initialTab,
  pendingCount,
  usersCount,
  carsCount,
  bookingsCount,
  statusFilter,
  query,
}: AdminWorkspaceProps) {
  const navItems = [
    {
      label: "Overview",
      href: buildAdminHref({ tab: "overview" }),
      icon: LayoutDashboard,
      active: initialTab === "overview",
    },
    {
      label: "Applications",
      href: buildAdminHref({ tab: "applications", status: statusFilter }),
      icon: ClipboardCheck,
      active: initialTab === "applications",
      badge: pendingCount,
    },
    {
      label: "Messages",
      href: "/admin/messages",
      icon: MessageSquare,
    },
    {
      label: "Manage filters",
      href: "/admin/filters",
      icon: SlidersHorizontal,
    },
    {
      label: "Platform controls",
      href: "/admin/platform",
      icon: Settings2,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:py-6">
        <aside className="hidden rounded-2xl border border-border/80 bg-white p-4 shadow-sm lg:block">
          <div className="rounded-2xl bg-primary px-4 py-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              Hayame
            </p>
            <h2 className="mt-1 text-xl font-semibold">Admin console</h2>
            <p className="mt-3 text-xs leading-5 text-white/70">
              Review hosts, manage listings, and keep platform operations in one
              workspace.
            </p>
          </div>

          <nav className="mt-5 space-y-1">
            {navItems.map((item) => (
              <AdminNavLink key={item.label} {...item} />
            ))}
          </nav>

          <div className="mt-6 rounded-2xl border border-brand/20 bg-brand/5 p-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {pendingCount} pending
                </p>
                <p className="text-xs text-gray-600">Host reviews waiting</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">
                  Website admin
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Platform overview
                </h1>
              </div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <form
                  action="/admin"
                  method="get"
                  className="flex min-w-0 items-center rounded-full border border-border bg-gray-50 px-3 py-2"
                >
                  <Search className="h-4 w-4 shrink-0 text-gray-500" />
                  <input type="hidden" name="tab" value="applications" />
                  <input type="hidden" name="status" value={statusFilter} />
                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="Search applications"
                    className="min-w-0 bg-transparent px-2 text-sm text-gray-800 outline-none placeholder:text-gray-500"
                  />
                </form>
                <div className="flex flex-wrap items-center gap-2">
                  <TopAction href="/admin/messages" icon={MessageSquare}>
                    Messages
                  </TopAction>
                  <TopAction href="/admin/filters" icon={SlidersHorizontal}>
                    Filters
                  </TopAction>
                  <TopAction href="/admin/platform" icon={Settings2}>
                    Controls
                  </TopAction>
                  <form action={logoutAction}>
                    <PendingSubmitButton
                      pendingLabel="Signing out..."
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign out
                    </PendingSubmitButton>
                  </form>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <AdminStatCard
                label="Users"
                value={usersCount}
                helper="Active customer profiles"
                icon={Users}
                tone="brand"
              />
              <AdminStatCard
                label="Vehicles"
                value={carsCount}
                helper="Listings in the catalog"
                icon={Car}
                tone="blue"
              />
              <AdminStatCard
                label="Bookings"
                value={bookingsCount}
                helper="Trip records captured"
                icon={WalletCards}
                tone="slate"
              />
              <AdminStatCard
                label="Approvals"
                value={pendingCount}
                helper="Host applications pending"
                icon={ShieldCheck}
                tone="green"
                href={buildAdminHref({ tab: "applications", status: "pending" })}
              />
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

function AdminNavLink({
  label,
  href,
  icon: Icon,
  active,
  badge,
}: {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: number;
}) {
  return (
    <AdminLoadingLink
      href={href}
      indicator="inline"
      pendingLabel="Loading..."
      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-brand text-white shadow-sm"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className="inline-flex min-w-0 items-center gap-3">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      {badge ? (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] ${
            active ? "bg-white/20 text-white" : "bg-brand/10 text-brand"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </AdminLoadingLink>
  );
}

function TopAction({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <AdminLoadingLink
      href={href}
      indicator="inline"
      pendingLabel="Loading..."
      className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </AdminLoadingLink>
  );
}

function AdminStatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: number | null;
  helper: string;
  icon: LucideIcon;
  tone: "brand" | "blue" | "green" | "slate";
  href?: string;
}) {
  const toneClassName = {
    brand: "bg-primary text-white",
    blue: "bg-sky-500 text-white",
    green: "bg-emerald-600 text-white",
    slate: "bg-slate-700 text-white",
  }[tone];
  const card = (
    <div className="flex h-full items-start justify-between gap-4 rounded-2xl border border-border/80 bg-white p-4 shadow-sm transition-transform hover:-translate-y-0.5">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {value ?? 0}
        </p>
        <p className="mt-1 text-xs text-gray-500">{helper}</p>
      </div>
      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneClassName}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </div>
  );

  if (!href) return card;

  return (
    <AdminLoadingLink
      href={href}
      indicator="overlay"
      pendingLabel="Opening..."
      className="block h-full"
    >
      {card}
    </AdminLoadingLink>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    notice?: string;
    status?: string;
    q?: string;
    count?: string;
    tab?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const envReady = Boolean(
    isAdminAuthConfigured() &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const authed = await isAdminAuthenticated();
  const notice = getAdminNotice(resolvedSearchParams);

  if (!envReady) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Admin</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700">
            Set ADMIN_USERNAME, ADMIN_PASSWORD or ADMIN_PASSWORD_HASH,
            ADMIN_SESSION_SECRET, and SUPABASE_SERVICE_ROLE_KEY in your
            environment to enable admin access.
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
          <CardContent className="space-y-4">
            {resolvedSearchParams?.error === "invalid" ? (
              <AdminNotice
                tone="error"
                title="Admin sign-in failed"
                description="Check the username and password, then try again."
              />
            ) : null}
            {resolvedSearchParams?.error === "missing" ? (
              <AdminNotice
                tone="error"
                title="Admin credentials are not configured"
                description="Set the admin username and password environment variables before signing in."
              />
            ) : null}
            {notice ? (
              <AdminNotice
                tone={notice.tone}
                title={notice.title}
                description={notice.description}
              />
            ) : null}
            <form className="space-y-4" action={loginAction}>
              <div>
                <label className="text-sm font-semibold text-foreground">
                  Username
                </label>
                <input
                  name="username"
                  className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                  required
                />
              </div>
              <PendingSubmitButton
                pendingLabel="Signing in..."
                className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                Sign in
              </PendingSubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const admin = createSupabaseAdminClient() as any;
  const [
    { count: usersCount },
    { count: carsCount },
    { count: bookingsCount },
    { count: pendingCount },
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("cars").select("id", { count: "exact", head: true }),
    admin.from("bookings").select("id", { count: "exact", head: true }),
    admin
      .from("host_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const statusFilter = resolvedSearchParams?.status ?? "pending";
  const query = (resolvedSearchParams?.q ?? "").trim();
  const initialTab =
    resolvedSearchParams?.tab === "applications" ? "applications" : "overview";

  let applicationsQuery = admin
    .from("host_applications")
    .select(
      "id,user_id,full_name,phone,region,city,id_type,id_number,id_front_path,id_back_path,note,experience,fleet_size,status,submitted_at,created_at,reviewed_at,rejection_reason,reviewed_by,profiles:profiles!host_applications_user_id_fkey(full_name,avatar_url,phone,city)",
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
    .select(
      "id,title,owner_id,city,region,owner:profiles!cars_owner_id_fkey(full_name,avatar_url,phone)",
    )
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
      ? await admin
          .from("bookings")
          .select("car_id,start_date,end_date,status")
          .in("car_id", carIds)
      : { data: [] };

  const { data: blockRows } =
    carIds.length > 0
      ? await admin
          .from("car_availability")
          .select("car_id,start_date,end_date,available")
          .in("car_id", carIds)
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
    <AdminWorkspace
      initialTab={initialTab}
      pendingCount={pendingCount ?? 0}
      usersCount={usersCount ?? 0}
      carsCount={carsCount ?? 0}
      bookingsCount={bookingsCount ?? 0}
      statusFilter={statusFilter}
      query={query}
    >

      {notice ? (
        <AdminNotice
          tone={notice.tone}
          title={notice.title}
          description={notice.description}
        />
      ) : null}

      <AdminTabs
        initialTab={initialTab}
        overview={
          <div className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-border/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Gauge className="h-5 w-5 text-brand" aria-hidden="true" />
                    Work queue
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <AdminLoadingLink
                    href={buildAdminHref({
                      tab: "applications",
                      status: "pending",
                    })}
                    indicator="overlay"
                    pendingLabel="Opening..."
                    className="rounded-xl border border-brand/20 bg-brand/5 p-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                      Review hosts
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {pendingCount ?? 0}
                    </p>
                    <p className="text-xs text-gray-600">pending applications</p>
                  </AdminLoadingLink>
                  <div className="rounded-xl border border-border bg-gray-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Listings
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {cars?.length ?? 0}
                    </p>
                    <p className="text-xs text-gray-600">shown for review</p>
                  </div>
                  <div className="rounded-xl border border-border bg-gray-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Audit
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {auditRows?.length ?? 0}
                    </p>
                    <p className="text-xs text-gray-600">recent admin actions</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2
                      className="h-5 w-5 text-emerald-600"
                      aria-hidden="true"
                    />
                    Platform health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <span className="text-gray-600">Approved hosts</span>
                    <span className="font-semibold text-foreground">
                      {hosts.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <span className="text-gray-600">Loaded users</span>
                    <span className="font-semibold text-foreground">
                      {users?.length ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <span className="text-gray-600">Vehicle photo sets</span>
                    <span className="font-semibold text-foreground">
                      {photosByCar.size}
                    </span>
                  </div>
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
                    <div
                      key={host.user_id ?? host.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <ProfileAvatar
                          src={host.profiles?.avatar_url}
                          name={
                            host.profiles?.full_name ?? host.full_name ?? "Host"
                          }
                          className="h-10 w-10"
                        />
                        <div>
                          <p className="font-semibold text-foreground">
                            {host.profiles?.full_name ??
                              host.full_name ??
                              "Host"}
                          </p>
                          <p className="text-xs text-gray-600">
                            {host.profiles?.phone ?? host.phone ?? "No phone"}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Vehicles:{" "}
                            {carsByOwner.get(host.user_id ?? host.id) ?? 0}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {host.profiles?.city ?? host.city ?? "-"}
                      </span>
                    </div>
                  ))}
                  {(hosts ?? []).length === 0 ? (
                    <p className="text-sm text-gray-600">
                      No approved hosts yet.
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-600">
                  Showing profile photos for the latest {users?.length ?? 0}{" "}
                  users.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(users ?? []).map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <ProfileAvatar
                          src={user.avatar_url}
                          name={user.full_name ?? "User"}
                          className="h-10 w-10"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {user.full_name ?? "User"}
                          </p>
                          <p className="truncate text-xs text-gray-600">
                            {user.phone ?? "No phone"}
                          </p>
                          <p className="truncate text-[11px] text-gray-500">
                            {user.city ?? "-"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700">
                          {user.is_host ? "Host" : "Guest"}
                        </span>
                        <Link
                          href={`/admin/messages?user=${user.id}`}
                          className="text-[11px] font-semibold text-brand"
                        >
                          Message
                        </Link>
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-[11px] font-semibold text-brand"
                        >
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
                      <PendingSubmitButton
                        className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                        pendingLabel="Deleting..."
                      >
                        Delete selected
                      </PendingSubmitButton>
                    </div>
                  ) : null}
                  <div className="space-y-3">
                    {(cars ?? []).map((car: any) => {
                      const bookings = bookingsByCar.get(car.id) ?? [];
                      const blocks = (blocksByCar.get(car.id) ?? []).filter(
                        (b: any) => b.available === false,
                      );
                      const listingPhotos = photosByCar.get(car.id) ?? [];
                      const previewImage = resolveCarImage(listingPhotos[0], {
                        id: car.id,
                        title: car.title,
                        city: car.city,
                        region: car.region,
                        carType: car.car_type,
                      });
                      return (
                        <div
                          key={car.id}
                          className="rounded-lg border border-border p-3"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                              <label className="mt-1 flex items-center gap-2 text-xs font-semibold text-gray-700">
                                <input
                                  type="checkbox"
                                  name="carIds"
                                  value={car.id}
                                  className="h-4 w-4 rounded border-border"
                                />
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
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {car.title}
                                </p>
                                <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                                  <ProfileAvatar
                                    src={car.owner?.avatar_url}
                                    name={car.owner?.full_name ?? "Host"}
                                    className="h-6 w-6"
                                  />
                                  <span className="truncate">
                                    Host: {car.owner?.full_name ?? "Host"}{" "}
                                    {car.owner?.phone
                                      ? `| ${car.owner.phone}`
                                      : ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {car.city ?? "-"}
                              </span>
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
                              <PendingSubmitButton
                                formAction={deleteListingAction}
                                name="carId"
                                value={car.id}
                                className="rounded-md border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                                pendingLabel="Deleting..."
                              >
                                Delete
                              </PendingSubmitButton>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            Bookings: {bookings.length} | Host blocks:{" "}
                            {blocks.length}
                          </div>
                          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                            {listingPhotos.length > 0 ? (
                              listingPhotos.map(
                                (photoUrl: string, index: number) => (
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
                                ),
                              )
                            ) : (
                              <p className="text-[11px] text-gray-500">
                                No photos uploaded yet.
                              </p>
                            )}
                          </div>
                          {bookings.length > 0 ? (
                            <div className="mt-2 text-[11px] text-gray-600">
                              Upcoming bookings:{" "}
                              {bookings
                                .slice(0, 2)
                                .map(
                                  (b: any) =>
                                    `${b.start_date} -> ${b.end_date}`,
                                )
                                .join(", ")}
                            </div>
                          ) : null}
                          {blocks.length > 0 ? (
                            <div className="mt-1 text-[11px] text-gray-600">
                              Host blocks:{" "}
                              {blocks
                                .slice(0, 2)
                                .map(
                                  (b: any) =>
                                    `${b.start_date} -> ${b.end_date}`,
                                )
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
                    <div
                      key={row.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {row.action}
                        </p>
                        <p className="text-xs text-gray-600">
                          {row.performed_by ?? "admin"}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {row.created_at
                          ? new Date(row.created_at).toLocaleString()
                          : "—"}
                      </span>
                    </div>
                  ))}
                  {(auditRows ?? []).length === 0 ? (
                    <p className="text-sm text-gray-600">
                      No admin actions yet.
                    </p>
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
                  <div
                    key={item.title}
                    className="rounded-lg border border-border bg-gray-50 p-3"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
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
                  <AdminLoadingLink
                    key={status}
                    indicator="inline"
                    pendingLabel="Loading..."
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      statusFilter === status
                        ? "border-brand bg-brand text-white"
                        : "border-border text-gray-700"
                    }`}
                    href={buildAdminHref({
                      tab: "applications",
                      status,
                      q: query || undefined,
                    })}
                  >
                    {status}
                  </AdminLoadingLink>
                ))}
                <form
                  className="flex flex-1 flex-wrap gap-2 sm:flex-none"
                  action="/admin"
                  method="get"
                >
                  <input type="hidden" name="tab" value="applications" />
                  <input type="hidden" name="status" value={statusFilter} />
                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="Search name or phone"
                    className="min-w-0 flex-1 rounded-md border border-border px-3 py-1 text-xs text-gray-700 sm:w-64"
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Search
                  </button>
                </form>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {applications?.map((app: any) => {
                  const profileHref = app.user_id
                    ? `/admin/users/${app.user_id}#host-application`
                    : null;
                  const submittedLabel = app.submitted_at
                    ? new Date(app.submitted_at).toLocaleDateString()
                    : app.created_at
                      ? new Date(app.created_at).toLocaleDateString()
                      : "—";
                  const reviewedLabel = app.reviewed_at
                    ? new Date(app.reviewed_at).toLocaleDateString()
                    : "Not reviewed yet";
                  const statusClassName =
                    app.status === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : app.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700";

                  return (
                    <article
                      key={app.id}
                      className="rounded-2xl border border-border bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          {profileHref ? (
                            <AdminLoadingLink
                              href={profileHref}
                              indicator="overlay"
                              pendingLabel="Opening profile..."
                              className="flex min-w-0 flex-1 items-start gap-3 rounded-xl border border-transparent p-1 hover:border-border hover:bg-gray-50"
                            >
                              <ProfileAvatar
                                src={app.profiles?.avatar_url}
                                name={
                                  app.profiles?.full_name ??
                                  app.full_name ??
                                  "User"
                                }
                                className="h-12 w-12"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-base font-semibold text-foreground">
                                  {app.full_name ?? "User"}
                                </p>
                                <p className="truncate text-sm text-gray-600">
                                  {app.profiles?.full_name ?? "Profile record"}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {app.phone ?? app.profiles?.phone ?? "No phone"}
                                  {" · "}
                                  {app.city ?? app.profiles?.city ?? "No city"}
                                </p>
                              </div>
                            </AdminLoadingLink>
                          ) : (
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                              <ProfileAvatar
                                src={app.profiles?.avatar_url}
                                name={
                                  app.profiles?.full_name ??
                                  app.full_name ??
                                  "User"
                                }
                                className="h-12 w-12"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-base font-semibold text-foreground">
                                  {app.full_name ?? "User"}
                                </p>
                                <p className="truncate text-sm text-gray-600">
                                  {app.profiles?.full_name ?? "Profile record"}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {app.phone ?? app.profiles?.phone ?? "No phone"}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClassName}`}
                            >
                              {app.status}
                            </span>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                              Submitted {submittedLabel}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-border bg-gray-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Location
                            </p>
                            <p className="mt-2 text-sm text-gray-800">
                              {app.city ?? app.profiles?.city ?? "—"}
                              {app.region ? `, ${app.region}` : ""}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border bg-gray-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Contact
                            </p>
                            <p className="mt-2 text-sm text-gray-800">
                              {app.phone ?? app.profiles?.phone ?? "—"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border bg-gray-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              ID details
                            </p>
                            <p className="mt-2 text-sm text-gray-800">
                              {app.id_type ?? "—"}{" "}
                              {app.id_number ? `• ${app.id_number}` : ""}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border bg-gray-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Fleet size
                            </p>
                            <p className="mt-2 text-sm text-gray-800">
                              {typeof app.fleet_size === "number"
                                ? app.fleet_size
                                : "—"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border bg-gray-50 p-3 sm:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Experience
                            </p>
                            <p className="mt-2 whitespace-pre-line text-sm text-gray-800">
                              {app.experience ?? "—"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border bg-gray-50 p-3 sm:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Notes
                            </p>
                            <p className="mt-2 whitespace-pre-line text-sm text-gray-800">
                              {app.note ?? "—"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border bg-gray-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Reviewed by
                            </p>
                            <p className="mt-2 text-sm text-gray-800">
                              {app.reviewed_by ?? "—"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border bg-gray-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Reviewed at
                            </p>
                            <p className="mt-2 text-sm text-gray-800">
                              {reviewedLabel}
                            </p>
                          </div>
                          <div className="rounded-xl border border-border bg-gray-50 p-3 sm:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Rejection reason
                            </p>
                            <p className="mt-2 whitespace-pre-line text-sm text-gray-800">
                              {app.rejection_reason ?? "—"}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-border p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              ID front
                            </p>
                            <div className="mt-2">
                              <a
                                className="inline-flex rounded-md border border-border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                href={`/api/host-applications/${app.id}/files?type=front`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open ID front
                              </a>
                            </div>
                          </div>
                          <div className="rounded-xl border border-border p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              ID back
                            </p>
                            <div className="mt-2">
                              <a
                                className="inline-flex rounded-md border border-border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                href={`/api/host-applications/${app.id}/files?type=back`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open ID back
                              </a>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-border pt-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {profileHref ? (
                              <AdminLoadingLink
                                href={profileHref}
                                indicator="inline"
                                pendingLabel="Opening..."
                                className="inline-flex rounded-md border border-border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                Open profile
                              </AdminLoadingLink>
                            ) : null}
                            {app.status !== "pending" ? (
                              <span className="text-xs text-gray-500">
                                This host application is already {app.status}.
                              </span>
                            ) : null}
                          </div>

                          {app.status === "pending" ? (
                            <div className="mt-4 space-y-3">
                              <form
                                action={reviewAction}
                                className="flex flex-wrap items-center gap-2"
                              >
                                <input
                                  type="hidden"
                                  name="applicationId"
                                  value={app.id}
                                />
                                <input
                                  type="hidden"
                                  name="tab"
                                  value="applications"
                                />
                                <input
                                  type="hidden"
                                  name="status"
                                  value={statusFilter}
                                />
                                <input type="hidden" name="q" value={query} />
                                <input
                                  type="hidden"
                                  name="action"
                                  value="approve"
                                />
                                <PendingSubmitButton
                                  pendingLabel="Approving host..."
                                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                                >
                                  Approve host
                                </PendingSubmitButton>
                              </form>

                              <form
                                action={reviewAction}
                                className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]"
                              >
                                <input
                                  type="hidden"
                                  name="applicationId"
                                  value={app.id}
                                />
                                <input
                                  type="hidden"
                                  name="tab"
                                  value="applications"
                                />
                                <input
                                  type="hidden"
                                  name="status"
                                  value={statusFilter}
                                />
                                <input type="hidden" name="q" value={query} />
                                <input
                                  type="hidden"
                                  name="action"
                                  value="reject"
                                />
                                <Input
                                  name="rejectionReason"
                                  placeholder="Reason for rejection"
                                />
                                <PendingSubmitButton
                                  pendingLabel="Rejecting host..."
                                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                                >
                                  Reject host
                                </PendingSubmitButton>
                              </form>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
                {applications?.length === 0 ? (
                  <p className="rounded-xl border border-border bg-white p-4 text-center text-sm text-gray-600 xl:col-span-2">
                    No host applications yet.
                  </p>
                ) : null}
              </div>

              <div className="hidden">

              <div className="space-y-3 md:hidden">
                {applications?.map((app: any) => (
                  <div
                    key={app.id}
                    className="rounded-xl border border-border bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <ProfileAvatar
                          src={app.profiles?.avatar_url}
                          name={
                            app.profiles?.full_name ?? app.full_name ?? "User"
                          }
                          className="h-10 w-10"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {app.full_name}
                          </p>
                          <p className="truncate text-xs text-gray-600">
                            {app.profiles?.full_name ?? "User"}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                        {app.status}
                      </span>
                    </div>
                    {app.user_id ? (
                      <div className="mt-3">
                        <Link
                          href={`/admin/users/${app.user_id}#host-application`}
                          className="inline-flex rounded-md border border-border px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          View details
                        </Link>
                      </div>
                    ) : null}
                    <div className="mt-3 grid gap-2 text-xs text-gray-600">
                      <div>Region: {app.region ?? "—"}</div>
                      <div>City: {app.city ?? app.profiles?.city ?? "—"}</div>
                      <div>
                        Phone: {app.phone ?? app.profiles?.phone ?? "—"}
                      </div>
                      <div>
                        ID:{" "}
                        {app.id_type
                          ? `${app.id_type} ${app.id_number ?? ""}`
                          : "—"}
                      </div>
                      <div>
                        ID Images:{" "}
                        <a
                          className="text-brand"
                          href={`/api/host-applications/${app.id}/files?type=front`}
                        >
                          Front
                        </a>{" "}
                        /{" "}
                        <a
                          className="text-brand"
                          href={`/api/host-applications/${app.id}/files?type=back`}
                        >
                          Back
                        </a>
                      </div>
                      <div>
                        Fleet size:{" "}
                        {typeof app.fleet_size === "number"
                          ? app.fleet_size
                          : "—"}
                      </div>
                      <div>Experience: {app.experience ?? "—"}</div>
                      <div>Notes: {app.note ?? "—"}</div>
                      <div>Reviewed by: {app.reviewed_by ?? "—"}</div>
                      <div>Reject reason: {app.rejection_reason ?? "—"}</div>
                      <div>
                        Reviewed at:{" "}
                        {app.reviewed_at
                          ? new Date(app.reviewed_at).toLocaleDateString()
                          : "—"}
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
                            <input
                              type="hidden"
                              name="applicationId"
                              value={app.id}
                            />
                            <input
                              type="hidden"
                              name="tab"
                              value="applications"
                            />
                            <input
                              type="hidden"
                              name="status"
                              value={statusFilter}
                            />
                            <input type="hidden" name="q" value={query} />
                            <input
                              type="hidden"
                              name="action"
                              value="approve"
                            />
                            <PendingSubmitButton
                              pendingLabel="Approving..."
                              className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                            >
                              Approve
                            </PendingSubmitButton>
                          </form>
                          <form action={reviewAction}>
                            <input
                              type="hidden"
                              name="applicationId"
                              value={app.id}
                            />
                            <input
                              type="hidden"
                              name="tab"
                              value="applications"
                            />
                            <input
                              type="hidden"
                              name="status"
                              value={statusFilter}
                            />
                            <input type="hidden" name="q" value={query} />
                            <input type="hidden" name="action" value="reject" />
                            <PendingSubmitButton
                              pendingLabel="Rejecting..."
                              className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white"
                            >
                              Reject
                            </PendingSubmitButton>
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
                <div className="overflow-x-auto rounded-xl border border-border">
                  <Table className="min-w-[1180px]">
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
                              name={
                                app.profiles?.full_name ??
                                app.full_name ??
                                "User"
                              }
                              className="h-10 w-10"
                            />
                            <div className="min-w-0">
                              <div className="truncate font-semibold">
                                {app.full_name}
                              </div>
                              <div className="truncate text-xs text-gray-600">
                                {app.profiles?.full_name ?? "User"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{app.region ?? "—"}</TableCell>
                        <TableCell>
                          {app.city ?? app.profiles?.city ?? "—"}
                        </TableCell>
                        <TableCell>
                          {app.phone ?? app.profiles?.phone ?? "—"}
                        </TableCell>
                        <TableCell>
                          {typeof app.fleet_size === "number"
                            ? app.fleet_size
                            : "—"}
                        </TableCell>
                        <TableCell className="max-w-[16rem] text-xs text-gray-600">
                          {app.experience ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-gray-600">
                          {app.id_type ?? "—"} {app.id_number ?? ""}
                          <div className="mt-1 flex gap-2">
                            <a
                              className="text-brand"
                              href={`/api/host-applications/${app.id}/files?type=front`}
                            >
                              Front
                            </a>
                            <a
                              className="text-brand"
                              href={`/api/host-applications/${app.id}/files?type=back`}
                            >
                              Back
                            </a>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          {app.status}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-gray-600">
                          {app.submitted_at
                            ? new Date(app.submitted_at).toLocaleDateString()
                            : app.created_at
                              ? new Date(app.created_at).toLocaleDateString()
                              : "—"}
                        </TableCell>
                        <TableCell className="max-w-[18rem] text-xs text-gray-600">
                          {app.note ?? "—"}
                          <div className="text-[11px] text-gray-500">
                            Reviewed by: {app.reviewed_by ?? "—"}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            Reject reason: {app.rejection_reason ?? "—"}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            Reviewed at:{" "}
                            {app.reviewed_at
                              ? new Date(app.reviewed_at).toLocaleDateString()
                              : "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {app.user_id ? (
                              <Link
                                href={`/admin/users/${app.user_id}#host-application`}
                                className="rounded-md border border-border px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                View details
                              </Link>
                            ) : null}
                            {app.status === "pending" ? (
                              <>
                                <form
                                  action={reviewAction}
                                  className="flex items-center gap-2"
                              >
                                <input
                                  type="hidden"
                                  name="tab"
                                  value="applications"
                                />
                                <input
                                  type="hidden"
                                  name="status"
                                  value={statusFilter}
                                />
                                <input type="hidden" name="q" value={query} />
                                <input
                                  type="hidden"
                                  name="applicationId"
                                  value={app.id}
                                />
                                <input
                                  type="hidden"
                                  name="action"
                                  value="approve"
                                />
                                <PendingSubmitButton
                                  pendingLabel="Approving..."
                                  className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                                >
                                  Approve
                                </PendingSubmitButton>
                              </form>
                              <form
                                action={reviewAction}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="hidden"
                                  name="tab"
                                  value="applications"
                                />
                                <input
                                  type="hidden"
                                  name="status"
                                  value={statusFilter}
                                />
                                <input type="hidden" name="q" value={query} />
                                <input
                                  type="hidden"
                                  name="applicationId"
                                  value={app.id}
                                />
                                <input
                                  type="hidden"
                                  name="action"
                                  value="reject"
                                />
                                <input
                                  name="rejectionReason"
                                  placeholder="Reason"
                                  className="hidden w-28 rounded-md border border-border px-2 py-1 text-xs text-gray-700 sm:block"
                                />
                                <PendingSubmitButton
                                  pendingLabel="Rejecting..."
                                  className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white"
                                >
                                  Reject
                                </PendingSubmitButton>
                              </form>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {app.status === "approved"
                                  ? "Approved"
                                  : "Rejected"}
                              </span>
                            )}
                          </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {applications?.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={11}
                            className="text-center text-sm text-gray-600"
                          >
                            No host applications yet.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </div>
              </div>
            </CardContent>
          </Card>
        }
      />
    </AdminWorkspace>
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
