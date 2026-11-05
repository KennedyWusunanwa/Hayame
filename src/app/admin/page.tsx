import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import {
  BarChart3,
  Car,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  Gauge,
  ShieldCheck,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { AdminLoadingLink } from "@/components/admin/admin-loading-link";
import { AdminNotice } from "@/components/admin/admin-notice";
import { PageHeader, SeverityPill } from "@/components/admin/admin-ui";
import { PreviewLink } from "@/components/admin/image-lightbox";
import { ShellSync } from "@/components/admin/shell-sync";
import { PendingSubmitButton } from "@/components/admin/pending-submit-button";
import { AdminSearchForm } from "@/components/admin/admin-search";
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
  getCurrentAdmin,
  isAdminAuthConfigured,
  requireAdmin,
  signInAdmin,
} from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { queryAudit } from "@/lib/admin-audit-query";
import { can, type Permission } from "@/lib/admin-permissions";
import { reviewHostApplication } from "@/lib/admin-host-applications";
import { resolveCarImage } from "@/lib/car-images";
import { ilikeTerm, matchesQuery } from "@/lib/admin-search";
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

function getAdminNotice(searchParams: { notice?: string; count?: string }): {
  tone: "success" | "error" | "info";
  title: string;
  description?: string;
} | null {
  switch (searchParams.notice) {
    case "forbidden":
      return {
        tone: "error",
        title: "Your role can't do that",
        description: "Ask a super admin if you need access to that area.",
      };
    case "password-changed":
      return {
        tone: "success",
        title: "Password updated",
        description: "Use the new password next time you sign in.",
      };
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
        description:
          "The host application was approved and the user profile was updated.",
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
  const identifier = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!identifier || !password) redirectToAdmin({ error: "invalid" });

  const result = await signInAdmin(identifier, password);
  if (result === "missing") redirectToAdmin({ error: "missing" });
  if (result === "locked") redirectToAdmin({ error: "locked" });
  if (result !== "ok") redirectToAdmin({ error: "invalid" });
  redirectToAdmin();
}

async function reviewAction(formData: FormData) {
  "use server";
  const actor = await requireAdmin("applications.review");
  const action = String(formData.get("action") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");
  const rejectionReason = String(formData.get("rejectionReason") ?? "");
  const currentTab =
    typeof formData.get("tab") === "string" ? String(formData.get("tab")) : "";
  const reviewer = actor.email;

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
    typeof formData.get("q") === "string"
      ? String(formData.get("q") ?? "")
      : "";

  redirectToAdmin({
    notice: action === "approve" ? "host-approved" : "host-rejected",
    tab: currentTab === "applications" ? "applications" : undefined,
    status: currentStatus,
    q: currentQuery,
  });
}

async function deleteListingAction(formData: FormData) {
  "use server";
  const actor = await requireAdmin("vehicles.delete");
  const carId = String(formData.get("carId") ?? "");
  if (!carId) {
    redirectToAdmin();
  }

  const admin = createSupabaseAdminClient() as any;
  const { data: doomed } = await admin.from("cars").select("title,city").eq("id", carId).maybeSingle();
  await admin.from("cars").delete().eq("id", carId);
  await logAdminAction({
    action: "listing_deleted",
    summary: `${actor.name} deleted the listing ${doomed?.title ?? carId}${doomed?.city ? ` (${doomed.city})` : ""}`,
    targetId: carId,
    targetType: "car",
    actor,
  });
  redirectToAdmin({ notice: "listing-deleted" });
}

async function bulkDeleteListingsAction(formData: FormData) {
  "use server";
  const actor = await requireAdmin("vehicles.delete");

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
  await logAdminAction({
    action: "listing_bulk_deleted",
    summary: `${actor.name} bulk-deleted ${carIds.length} listing${carIds.length === 1 ? "" : "s"}`,
    targetType: "car",
    metadata: { count: carIds.length, car_ids: carIds.join(",") },
    actor,
  });
  redirectToAdmin({ notice: "listings-deleted", count: carIds.length });
}

type AdminWorkspaceProps = {
  children: ReactNode;
  initialTab: AdminTab;
  pendingCount: number;
  usersCount: number;
  carsCount: number;
  bookingsCount: number;
  statusFilter: string;
  query: string;
  verifiedFilter: string;
  adminName: string;
};

type AdminTab =
  | "overview"
  | "applications"
  | "hosts"
  | "users"
  | "vehicles"
  | "audit";

const TAB_TITLES: Record<AdminTab, { title: string; description: string }> = {
  overview: { title: "Dashboard", description: "What needs you today, and how the platform is doing." },
  applications: { title: "Host applications", description: "Review ID and details before anyone can list a car." },
  hosts: { title: "Hosts", description: "Everyone who can list vehicles on Hayame." },
  users: { title: "Users", description: "Customer and host profiles." },
  vehicles: { title: "Vehicles", description: "Every listing in the catalog." },
  audit: { title: "Audit log", description: "Moved to its own page." },
};

const TAB_PERMISSIONS: Record<AdminTab, Permission> = {
  overview: "overview.view",
  applications: "applications.review",
  hosts: "hosts.view",
  users: "users.view",
  vehicles: "vehicles.review",
  audit: "audit.view",
};

/** Tabs that list enough rows to need a search box, and what it searches. */
const SEARCH_PLACEHOLDERS: Partial<Record<AdminTab, string>> = {
  applications: "Search applications by name or phone",
  hosts: "Search hosts by name, phone or city",
  users: "Search users by name, email, phone or city",
  vehicles: "Search vehicles by title, make, host or city",
};

function resolveAdminTab(raw?: string): AdminTab {
  if (
    raw === "applications" ||
    raw === "hosts" ||
    raw === "users" ||
    raw === "vehicles" ||
    raw === "audit"
  ) {
    return raw;
  }
  return "overview";
}

function AdminWorkspace({
  children,
  initialTab,
  pendingCount,
  usersCount,
  carsCount,
  bookingsCount,
  statusFilter,
  query,
  verifiedFilter,
  adminName,
}: AdminWorkspaceProps) {
  const heading = TAB_TITLES[initialTab];
  return (
    <div className="space-y-6">
      <ShellSync expect="shell" />
      <PageHeader
        eyebrow={initialTab === "overview" ? `Welcome back, ${adminName.split(" ")[0]}` : "Admin"}
        title={heading.title}
        description={heading.description}
        actions={
          SEARCH_PLACEHOLDERS[initialTab] ? (
            <AdminSearchForm
              action="/admin"
              placeholder={SEARCH_PLACEHOLDERS[initialTab] ?? "Search"}
              query={query}
              keep={{
                tab: initialTab,
                status: initialTab === "applications" ? statusFilter : undefined,
                verified:
                  initialTab === "users" && verifiedFilter !== "all"
                    ? verifiedFilter
                    : undefined,
              }}
            />
          ) : null
        }
      />

      {initialTab === "overview" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard label="Users" value={usersCount} helper="Customer profiles" icon={Users} tone="brand" />
          <AdminStatCard label="Vehicles" value={carsCount} helper="Listings in the catalog" icon={Car} tone="blue" />
          <AdminStatCard label="Bookings" value={bookingsCount} helper="Trip records captured" icon={WalletCards} tone="slate" />
          <AdminStatCard
            label="Approvals"
            value={pendingCount}
            helper="Host applications pending"
            icon={ShieldCheck}
            tone="brand"
            href={buildAdminHref({ tab: "applications", status: "pending" })}
          />
        </div>
      ) : null}

      {children}
    </div>
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
  tone: "brand" | "blue" | "slate";
  href?: string;
}) {
  const toneClassName = {
    brand: "bg-primary text-white",
    blue: "bg-sky-500 text-white",
    slate: "bg-slate-700 text-white",
  }[tone];
  const card = (
    <div className="flex h-full items-start justify-between gap-3 rounded-2xl border border-border/80 bg-white p-3 shadow-sm transition-transform hover:-translate-y-0.5 sm:gap-4 sm:p-4">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {value ?? 0}
        </p>
        <p className="mt-1 text-xs text-gray-500">{helper}</p>
      </div>
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl ${toneClassName}`}
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
    verified?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const envReady = Boolean(
    isAdminAuthConfigured() &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const me = await getCurrentAdmin();
  const authed = me !== null;
  const notice = getAdminNotice(resolvedSearchParams);

  if (!envReady) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Admin</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700">
            Set SUPABASE_SERVICE_ROLE_KEY (and ideally a long random
            ADMIN_SESSION_SECRET) in your environment to enable admin access.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authed) {
    const err = resolvedSearchParams?.error;
    return (
      <div className="grid min-h-screen bg-[#F4F8FD] lg:grid-cols-[1.05fr_1fr]">
        <ShellSync expect="bare" />
        <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#06182E_0%,#0A2B54_55%,#0E4C8C_100%)] p-12 text-white lg:flex">
          <div className="absolute -bottom-40 -right-32 h-[520px] w-[520px] rounded-full bg-white/[0.06]" aria-hidden />
          <Image src="/logo-white.png" alt="Hayame" width={160} height={58} className="h-12 w-auto self-start" priority unoptimized />
          <div className="relative">
            <h1 className="text-5xl font-black leading-[1.02] tracking-tight text-white">
              Run Hayame,<br />
              <span className="text-[#7CCBFF]">carefully.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/75">
              Hosts, listings, refunds and the site itself. Every action here is signed with your name and recorded.
            </p>
          </div>
          <p className="relative text-sm font-semibold text-white/60">www.hayamegh.com</p>
        </div>

        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <Image src="/logo.png" alt="Hayame" width={130} height={48} className="mb-8 h-10 w-auto lg:hidden" unoptimized />
            <h2 className="text-2xl font-black tracking-tight text-[#0A2B54]">Admin sign in</h2>
            <p className="mt-1.5 text-sm text-gray-600">Use the email and password your super admin gave you.</p>

            <div className="mt-6 space-y-3">
              {err === "invalid" ? (
                <AdminNotice tone="error" title="Sign-in failed" description="Check your email and password, then try again." />
              ) : null}
              {err === "locked" ? (
                <AdminNotice
                  tone="error"
                  title="Too many tries"
                  description="Sign-in is paused for 15 minutes. If this wasn't you, tell a super admin."
                />
              ) : null}
              {err === "missing" ? (
                <AdminNotice
                  tone="error"
                  title="Admin credentials are not configured"
                  description="Set the admin username and password environment variables before signing in."
                />
              ) : null}
              {notice ? <AdminNotice tone={notice.tone} title={notice.title} description={notice.description} /> : null}
            </div>

            <form className="mt-6 space-y-4" action={loginAction}>
              <div>
                <label className="text-sm font-semibold text-[#0A2B54]" htmlFor="admin-id">
                  Email or username
                </label>
                <input
                  id="admin-id"
                  name="username"
                  autoComplete="username"
                  className="mt-1.5 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[#0A2B54]" htmlFor="admin-pw">
                  Password
                </label>
                <input
                  id="admin-pw"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="mt-1.5 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  required
                />
              </div>
              <PendingSubmitButton
                pendingLabel="Signing in…"
                className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-110"
              >
                Sign in
              </PendingSubmitButton>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (me.mustChangePassword) redirect("/admin/account?force=1");
  const requestedTab = resolveAdminTab(resolvedSearchParams?.tab);
  if (requestedTab === "audit") redirect("/admin/audit");
  if (!can(me.role, TAB_PERMISSIONS[requestedTab])) {
    const fallback = (["overview", "applications", "hosts", "users", "vehicles"] as AdminTab[]).find((tab) =>
      can(me.role, TAB_PERMISSIONS[tab]),
    );
    if (!fallback) redirect("/admin/account");
    redirect(`/admin?tab=${fallback}&notice=forbidden`);
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
  const initialTab = resolveAdminTab(resolvedSearchParams?.tab);

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
  const hostTerm = initialTab === "hosts" ? query : "";
  const visibleHosts = hostTerm
    ? hosts.filter((host: any) =>
        matchesQuery(
          hostTerm,
          host.profiles?.full_name,
          host.full_name,
          host.profiles?.phone,
          host.phone,
          host.profiles?.city,
          host.city,
          host.region,
        ),
      )
    : hosts;

  // Vehicles: the search runs in the database so it keeps working once the
  // catalog is large. A host name or phone is resolved to owner ids first and
  // OR-ed into the same filter.
  const vehicleTerm = initialTab === "vehicles" ? ilikeTerm(query) : "";
  let matchingOwnerIds: string[] = [];
  if (vehicleTerm) {
    const { data: ownerRows } = await admin
      .from("profiles")
      .select("id")
      .or(`full_name.ilike.%${vehicleTerm}%,phone.ilike.%${vehicleTerm}%`)
      .limit(100);
    matchingOwnerIds = (ownerRows ?? []).map((row: any) => String(row.id));
  }
  let carsQuery = admin
    .from("cars")
    .select(
      "id,title,owner_id,city,region,daily_price,approval_status,is_available,car_type,brand,model,car_year,created_at,allow_one_day_booking,with_driver,owner:profiles!cars_owner_id_fkey(full_name,avatar_url,phone)",
    )
    .order("created_at", { ascending: false })
    .limit(vehicleTerm ? 200 : 60);
  if (vehicleTerm) {
    const filters = [
      `title.ilike.%${vehicleTerm}%`,
      `brand.ilike.%${vehicleTerm}%`,
      `model.ilike.%${vehicleTerm}%`,
      `city.ilike.%${vehicleTerm}%`,
      `region.ilike.%${vehicleTerm}%`,
      `car_type.ilike.%${vehicleTerm}%`,
    ];
    if (matchingOwnerIds.length > 0) {
      filters.push(`owner_id.in.(${matchingOwnerIds.join(",")})`);
    }
    carsQuery = carsQuery.or(filters.join(","));
  }
  const { data: cars } = await carsQuery;

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

  const userTerm = initialTab === "users" ? ilikeTerm(query) : "";

  // Login-blocking verification state lives on the auth record, not on
  // `profiles.email_verified` (which is a separate, admin-set trust badge). An
  // unverified account here means that person literally cannot get in, so it
  // belongs on the list rather than one click deeper.
  const authUsersById = new Map<
    string,
    { email: string | null; emailConfirmedAt: string | null }
  >();
  try {
    for (let page = 1; page <= 10; page += 1) {
      const { data: authPage, error: authError } =
        await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (authError) break;
      const pageUsers = authPage?.users ?? [];
      pageUsers.forEach((authUser: any) => {
        authUsersById.set(authUser.id, {
          email: authUser.email ?? null,
          emailConfirmedAt: authUser.email_confirmed_at ?? null,
        });
      });
      if (pageUsers.length < 200) break;
    }
  } catch {
    // Non-fatal: the list still renders, just without verification badges.
  }

  // Users: name, phone and city are matched in the database; email lives on
  // the auth record, so matching ids are gathered from the list above and
  // OR-ed in.
  let usersQuery = admin
    .from("profiles")
    .select("id,full_name,avatar_url,phone,city,is_host,host_level")
    .order("full_name", { ascending: true })
    .limit(userTerm ? 200 : 120);
  if (userTerm) {
    const emailMatchIds = Array.from(authUsersById.entries())
      .filter(([, info]) =>
        (info.email ?? "").toLowerCase().includes(userTerm.toLowerCase()),
      )
      .map(([id]) => id)
      .slice(0, 100);
    const filters = [
      `full_name.ilike.%${userTerm}%`,
      `phone.ilike.%${userTerm}%`,
      `city.ilike.%${userTerm}%`,
    ];
    if (emailMatchIds.length > 0) {
      filters.push(`id.in.(${emailMatchIds.join(",")})`);
    }
    usersQuery = usersQuery.or(filters.join(","));
  }
  const { data: users } = await usersQuery;

  const verifiedFilter =
    resolvedSearchParams.verified === "yes" ||
    resolvedSearchParams.verified === "no"
      ? resolvedSearchParams.verified
      : "all";

  const usersWithAuth = (users ?? []).map((user: any) => {
    const authInfo = authUsersById.get(user.id);
    return {
      ...user,
      email: authInfo?.email ?? null,
      emailConfirmedAt: authInfo?.emailConfirmedAt ?? null,
    };
  });

  const unverifiedCount = usersWithAuth.filter(
    (user: any) => authUsersById.has(user.id) && !user.emailConfirmedAt,
  ).length;

  const visibleUsers = usersWithAuth.filter((user: any) => {
    if (verifiedFilter === "all") return true;
    if (!authUsersById.has(user.id)) return false;
    return verifiedFilter === "yes"
      ? Boolean(user.emailConfirmedAt)
      : !user.emailConfirmedAt;
  });

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

  const recentActivity = can(me.role, "audit.view")
    ? (await queryAudit({ severity: "important" }, 1, 6)).rows
    : [];

  return (
    <AdminWorkspace
      initialTab={initialTab}
      pendingCount={pendingCount ?? 0}
      usersCount={usersCount ?? 0}
      carsCount={carsCount ?? 0}
      bookingsCount={bookingsCount ?? 0}
      statusFilter={statusFilter}
      query={query}
      verifiedFilter={verifiedFilter}
      adminName={me.name}
    >
      {notice ? (
        <AdminNotice
          tone={notice.tone}
          title={notice.title}
          description={notice.description}
        />
      ) : null}

      {initialTab === "overview" ? (
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
                    {recentActivity.length}
                  </p>
                  <p className="text-xs text-gray-600">recent important actions</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2
                    className="h-5 w-5 text-brand"
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

          {can(me.role, "audit.view") ? (
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileClock className="h-5 w-5 text-brand" aria-hidden="true" />
                  Recent admin activity
                </CardTitle>
                <Link href="/admin/audit" className="text-sm font-semibold text-brand">
                  Open audit log
                </Link>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-gray-600">No important admin actions yet.</p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {recentActivity.map((row) => (
                      <li key={row.id} className="flex items-start justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm text-foreground">{row.summary}</p>
                          <p className="text-xs text-gray-500">{row.adminEmail || "System"}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <SeverityPill severity={row.severity} />
                          <span className="text-[11px] text-gray-500">
                            {new Date(row.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3
                    className="h-5 w-5 text-brand"
                    aria-hidden="true"
                  />
                  Platform mix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AdminMetricBar
                  label="Users"
                  value={usersCount ?? 0}
                  max={Math.max(
                    usersCount ?? 0,
                    carsCount ?? 0,
                    bookingsCount ?? 0,
                    1,
                  )}
                />
                <AdminMetricBar
                  label="Vehicles"
                  value={carsCount ?? 0}
                  max={Math.max(
                    usersCount ?? 0,
                    carsCount ?? 0,
                    bookingsCount ?? 0,
                    1,
                  )}
                />
                <AdminMetricBar
                  label="Bookings"
                  value={bookingsCount ?? 0}
                  max={Math.max(
                    usersCount ?? 0,
                    carsCount ?? 0,
                    bookingsCount ?? 0,
                    1,
                  )}
                />
                <AdminMetricBar
                  label="Pending approvals"
                  value={pendingCount ?? 0}
                  max={Math.max(
                    usersCount ?? 0,
                    carsCount ?? 0,
                    bookingsCount ?? 0,
                    1,
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Gauge className="h-5 w-5 text-brand" aria-hidden="true" />
                  Quick access
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <OverviewShortcut
                  href={buildAdminHref({
                    tab: "applications",
                    status: "pending",
                  })}
                  icon={ClipboardCheck}
                  title="Applications"
                  value={pendingCount ?? 0}
                />
                <OverviewShortcut
                  href={buildAdminHref({ tab: "hosts" })}
                  icon={ShieldCheck}
                  title="Approved hosts"
                  value={hosts.length}
                />
                <OverviewShortcut
                  href={buildAdminHref({ tab: "users" })}
                  icon={Users}
                  title="Users"
                  value={usersCount ?? 0}
                />
                <OverviewShortcut
                  href={buildAdminHref({ tab: "vehicles" })}
                  icon={Car}
                  title="Vehicles"
                  value={carsCount ?? 0}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {initialTab === "hosts" ? (
        <Card>
          <CardHeader>
            <CardTitle>Approved hosts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-xs text-gray-600">
              Showing {visibleHosts.length} of {hosts.length} hosts
              {hostTerm ? ` for “${hostTerm}”` : ""}.
            </p>
            <div className="divide-y divide-border/60">
              {visibleHosts.map((host: any) => {
                const hostId = host.user_id ?? host.id;
                const hostName = host.profiles?.full_name ?? host.full_name ?? "Host";
                return (
                  <div
                    key={hostId}
                    className="group flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                  >
                    <Link
                      href={`/admin/users/${hostId}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1 -mx-2 transition-colors hover:bg-gray-50"
                    >
                      <ProfileAvatar
                        src={host.profiles?.avatar_url}
                        name={hostName}
                        className="h-10 w-10"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground group-hover:text-brand">
                          {hostName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {host.profiles?.phone ?? host.phone ?? "No phone"}
                          {" · "}
                          {host.profiles?.city ?? host.city ?? "-"}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Vehicles: {carsByOwner.get(hostId) ?? 0}
                        </p>
                      </div>
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/admin/users/${hostId}#host-application`}
                        className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Application &amp; ID
                      </Link>
                      <Link
                        href={`/admin/users/${hostId}`}
                        className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:brightness-110"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                );
              })}
              {visibleHosts.length === 0 ? (
                <p className="py-3 text-sm text-gray-600">
                  {hostTerm ? `No hosts match “${hostTerm}”.` : "No approved hosts yet."}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {initialTab === "users" ? (
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-600">
                Showing {visibleUsers.length} of {usersWithAuth.length} users.
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: "all", label: `All (${usersWithAuth.length})` },
                    { key: "no", label: `Unverified (${unverifiedCount})` },
                    {
                      key: "yes",
                      label: `Verified (${usersWithAuth.length - unverifiedCount})`,
                    },
                  ] as const
                ).map((option) => (
                  <Link
                    key={option.key}
                    href={buildAdminHref({
                      tab: "users",
                      verified: option.key === "all" ? undefined : option.key,
                      q: query,
                    })}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                      verifiedFilter === option.key
                        ? "bg-brand text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>
            {unverifiedCount > 0 && verifiedFilter !== "no" ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {unverifiedCount} {unverifiedCount === 1 ? "user" : "users"}{" "}
                cannot log in because their email is unverified. Open a user to
                resend the link or mark them verified.
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleUsers.map((user: any) => (
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
                        {user.email ?? user.phone ?? "No email"}
                      </p>
                      <p className="truncate text-[11px] text-gray-500">
                        {user.city ?? "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.emailConfirmedAt ? (
                      <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-700">
                        Verified
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
                        Unverified
                      </span>
                    )}
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700">
                      {user.is_host ? "Host" : "Guest"}
                    </span>
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
            {visibleUsers.length === 0 ? (
              <p className="text-sm text-gray-600">
                {userTerm ? `No users match “${query}”.` : "No users found."}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {initialTab === "vehicles" ? (
        <Card>
          <CardHeader>
            <CardTitle>Vehicles & availability</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={bulkDeleteListingsAction} className="space-y-4">
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-gray-700">
                  Showing {(cars ?? []).length}{" "}
                  {(cars ?? []).length === 1 ? "vehicle" : "vehicles"}
                  {vehicleTerm ? ` for “${query}”` : ", newest first"}. Tick
                  cards to delete several at once.
                </p>
                {(cars ?? []).length > 0 ? (
                  <PendingSubmitButton
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                    pendingLabel="Deleting..."
                  >
                    Delete selected
                  </PendingSubmitButton>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                  const status = vehicleStatus(car);
                  const todayIso = new Date().toISOString().slice(0, 10);
                  const nextTrip = [...bookings]
                    .filter((b: any) => String(b.end_date ?? "") >= todayIso)
                    .sort((a: any, b: any) =>
                      String(a.start_date).localeCompare(String(b.start_date)),
                    )[0];
                  const location =
                    [car.city, car.region].filter(Boolean).join(", ") ||
                    "Location not set";
                  return (
                    <article
                      key={car.id}
                      className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-white shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] bg-gray-100">
                        <Image
                          src={previewImage}
                          alt={car.title ?? "Listing photo"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        />
                        <label className="absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-semibold text-gray-700 shadow-sm">
                          <input
                            type="checkbox"
                            name="carIds"
                            value={car.id}
                            className="h-3.5 w-3.5 rounded border-border"
                          />
                          Select
                        </label>
                        <span
                          className={`absolute right-3 top-3 rounded-full px-2 py-1 text-[11px] font-semibold ${status.className}`}
                        >
                          {status.label}
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
                          <p className="mt-0.5 truncate text-xs text-gray-600">
                            {location}
                            {car.daily_price
                              ? ` · GHS ${Number(car.daily_price).toFixed(0)}/day`
                              : ""}
                          </p>
                        </div>
                        <Link
                          href={`/admin/users/${car.owner_id}`}
                          className="flex min-w-0 items-center gap-2 text-xs text-gray-600 hover:text-brand"
                        >
                          <ProfileAvatar
                            src={car.owner?.avatar_url}
                            name={car.owner?.full_name ?? "Host"}
                            className="h-6 w-6"
                          />
                          <span className="truncate">
                            {car.owner?.full_name ?? "Host"}
                            {car.owner?.phone ? ` · ${car.owner.phone}` : ""}
                          </span>
                        </Link>
                        <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                            {bookings.length}{" "}
                            {bookings.length === 1 ? "booking" : "bookings"}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                            {blocks.length}{" "}
                            {blocks.length === 1 ? "host block" : "host blocks"}
                          </span>
                          {nextTrip ? (
                            <span className="rounded-full bg-sky-50 px-2 py-1 text-brand">
                              Next trip {nextTrip.start_date}
                            </span>
                          ) : null}
                          {car.with_driver ? (
                            <span className="rounded-full bg-[#06223a] px-2 py-1 text-white">
                              With driver
                            </span>
                          ) : null}
                          {car.allow_one_day_booking ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                              1-day OK
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-auto flex items-center gap-2 border-t border-border/70 pt-3">
                          <Link
                            href={`/admin/cars/${car.id}/preview`}
                            className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Preview
                          </Link>
                          <Link
                            href={`/admin/cars/${car.id}/edit`}
                            className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Edit
                          </Link>
                          <PendingSubmitButton
                            formAction={deleteListingAction}
                            name="carId"
                            value={car.id}
                            className="ml-auto rounded-lg border border-red-200 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                            pendingLabel="Deleting..."
                          >
                            Delete
                          </PendingSubmitButton>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {(cars ?? []).length === 0 ? (
                <p className="rounded-xl border border-border bg-white p-6 text-center text-sm text-gray-600">
                  {vehicleTerm ? (
                    <>
                      No vehicles match “{query}”.{" "}
                      <Link
                        href={buildAdminHref({ tab: "vehicles" })}
                        className="font-semibold text-brand"
                      >
                        Clear search
                      </Link>
                    </>
                  ) : (
                    "No vehicles yet."
                  )}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      ) : null}

      {initialTab === "applications" ? (
        <Card className="mt-0">
          <CardHeader>
            <CardTitle>Host applications</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="mb-4 grid gap-2 sm:flex sm:flex-wrap sm:items-center">
              {["pending", "approved", "rejected"].map((status) => (
                <AdminLoadingLink
                  key={status}
                  indicator="inline"
                  pendingLabel="Loading..."
                  className={`inline-flex min-h-9 items-center justify-center rounded-xl border px-3 py-1 text-xs font-semibold sm:rounded-full ${
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
                className="grid gap-2 sm:ml-auto sm:flex sm:flex-none"
                action="/admin"
                method="get"
              >
                <input type="hidden" name="tab" value="applications" />
                <input type="hidden" name="status" value={statusFilter} />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search name or phone"
                  className="min-h-9 min-w-0 rounded-md border border-border px-3 py-2 text-sm text-gray-800 placeholder:text-gray-500 sm:w-64 sm:py-1 sm:text-xs"
                />
                <button
                  type="submit"
                  className="min-h-9 rounded-md border border-border px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:text-xs"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="grid gap-3 sm:gap-4 xl:grid-cols-2">
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
                    ? "bg-brand/10 text-brandHover"
                    : app.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700";

                return (
                  <article
                    key={app.id}
                    className="rounded-2xl border border-border bg-white p-3 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-col gap-4 sm:gap-5">
                      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-start sm:justify-between">
                        {profileHref ? (
                          <AdminLoadingLink
                            href={profileHref}
                            indicator="overlay"
                            pendingLabel="Opening profile..."
                            className="flex min-w-0 items-start gap-3 rounded-xl border border-transparent p-1 hover:border-border hover:bg-gray-50 sm:flex-1"
                          >
                            <ProfileAvatar
                              src={app.profiles?.avatar_url}
                              name={
                                app.profiles?.full_name ??
                                app.full_name ??
                                "User"
                              }
                              className="h-10 w-10 sm:h-12 sm:w-12"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold text-foreground">
                                {app.full_name ?? "User"}
                              </p>
                              <p className="truncate text-sm text-gray-600">
                                {app.profiles?.full_name ?? "Profile record"}
                              </p>
                              <p className="mt-1 break-words text-xs text-gray-500">
                                {app.phone ?? app.profiles?.phone ?? "No phone"}
                                <span className="mx-1">·</span>
                                {app.city ?? app.profiles?.city ?? "No city"}
                              </p>
                            </div>
                          </AdminLoadingLink>
                        ) : (
                          <div className="flex min-w-0 items-start gap-3 sm:flex-1">
                            <ProfileAvatar
                              src={app.profiles?.avatar_url}
                              name={
                                app.profiles?.full_name ??
                                app.full_name ??
                                "User"
                              }
                              className="h-10 w-10 sm:h-12 sm:w-12"
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
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClassName}`}
                          >
                            {app.status}
                          </span>
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            Submitted {submittedLabel}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                        <div className="rounded-xl border border-border bg-gray-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                            Location
                          </p>
                          <p className="mt-2 break-words text-sm text-gray-800">
                            {app.city ?? app.profiles?.city ?? "—"}
                            {app.region ? `, ${app.region}` : ""}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-gray-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                            Contact
                          </p>
                          <p className="mt-2 break-words text-sm text-gray-800">
                            {app.phone ?? app.profiles?.phone ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-gray-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                            ID details
                          </p>
                          <p className="mt-2 break-words text-sm text-gray-800">
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
                          <p className="mt-2 whitespace-pre-line break-words text-sm text-gray-800">
                            {app.experience ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-gray-50 p-3 sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                            Notes
                          </p>
                          <p className="mt-2 whitespace-pre-line break-words text-sm text-gray-800">
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
                          <p className="mt-2 whitespace-pre-line break-words text-sm text-gray-800">
                            {app.rejection_reason ?? "—"}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                        <div className="rounded-xl border border-border p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                            ID front
                          </p>
                          <div className="mt-2">
                            <PreviewLink
                              className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto"
                              items={[
                                { label: `${app.full_name ?? "Applicant"} · ID front`, src: `/api/host-applications/${app.id}/files?type=front` },
                                { label: `${app.full_name ?? "Applicant"} · ID back`, src: `/api/host-applications/${app.id}/files?type=back` },
                              ]}
                              index={0}
                            >
                              Preview ID front
                            </PreviewLink>
                          </div>
                        </div>
                        <div className="rounded-xl border border-border p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                            ID back
                          </p>
                          <div className="mt-2">
                            <PreviewLink
                              className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto"
                              items={[
                                { label: `${app.full_name ?? "Applicant"} · ID front`, src: `/api/host-applications/${app.id}/files?type=front` },
                                { label: `${app.full_name ?? "Applicant"} · ID back`, src: `/api/host-applications/${app.id}/files?type=back` },
                              ]}
                              index={1}
                            >
                              Preview ID back
                            </PreviewLink>
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
                              className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto"
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
                              className="grid gap-2 sm:flex sm:flex-wrap sm:items-center"
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
                                className="min-h-10 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
                              >
                                Approve host
                              </PendingSubmitButton>
                            </form>

                            <form
                              action={reviewAction}
                              className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
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
                                className="min-h-10 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white"
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
                        <PreviewLink
                          className="text-brand underline-offset-2 hover:underline"
                          items={[
                            { label: `${app.full_name ?? "Applicant"} · ID front`, src: `/api/host-applications/${app.id}/files?type=front` },
                            { label: `${app.full_name ?? "Applicant"} · ID back`, src: `/api/host-applications/${app.id}/files?type=back` },
                          ]}
                          index={0}
                        >
                          Front
                        </PreviewLink>{" "}
                        /{" "}
                        <PreviewLink
                          className="text-brand underline-offset-2 hover:underline"
                          items={[
                            { label: `${app.full_name ?? "Applicant"} · ID front`, src: `/api/host-applications/${app.id}/files?type=front` },
                            { label: `${app.full_name ?? "Applicant"} · ID back`, src: `/api/host-applications/${app.id}/files?type=back` },
                          ]}
                          index={1}
                        >
                          Back
                        </PreviewLink>
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
                              className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white"
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
                              <PreviewLink
                                className="text-brand underline-offset-2 hover:underline"
                                items={[
                                  { label: `${app.full_name ?? "Applicant"} · ID front`, src: `/api/host-applications/${app.id}/files?type=front` },
                                  { label: `${app.full_name ?? "Applicant"} · ID back`, src: `/api/host-applications/${app.id}/files?type=back` },
                                ]}
                                index={0}
                              >
                                Front
                              </PreviewLink>
                              <PreviewLink
                                className="text-brand underline-offset-2 hover:underline"
                                items={[
                                  { label: `${app.full_name ?? "Applicant"} · ID front`, src: `/api/host-applications/${app.id}/files?type=front` },
                                  { label: `${app.full_name ?? "Applicant"} · ID back`, src: `/api/host-applications/${app.id}/files?type=back` },
                                ]}
                                index={1}
                              >
                                Back
                              </PreviewLink>
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
                                    <input
                                      type="hidden"
                                      name="q"
                                      value={query}
                                    />
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
                                      className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white"
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
                                    <input
                                      type="hidden"
                                      name="q"
                                      value={query}
                                    />
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
      ) : null}
    </AdminWorkspace>
  );
}

function AdminMetricBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const width = max > 0 ? Math.max(6, Math.round((value / max) * 100)) : 6;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-foreground">{value}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-sky-100">
        <div
          className="h-full rounded-full bg-brand"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function OverviewShortcut({
  href,
  icon: Icon,
  title,
  value,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  value: number;
}) {
  return (
    <AdminLoadingLink
      href={href}
      indicator="overlay"
      pendingLabel="Opening..."
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-gray-50 p-3 transition-colors hover:border-brand/30 hover:bg-sky-50"
    >
      <span className="inline-flex min-w-0 items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="truncate text-sm font-semibold text-foreground">
          {title}
        </span>
      </span>
      <span className="text-lg font-semibold text-foreground">{value}</span>
    </AdminLoadingLink>
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

/** Pill for a vehicle card: paused beats everything, then the review state. */
function vehicleStatus(car: any): { label: string; className: string } {
  if (car.is_available === false) {
    return { label: "Paused", className: "bg-gray-800/85 text-white" };
  }
  const status = String(car.approval_status ?? "pending").toLowerCase();
  if (status === "approved") {
    return { label: "Live", className: "bg-emerald-500/95 text-white" };
  }
  if (status === "rejected") {
    return { label: "Rejected", className: "bg-red-600/95 text-white" };
  }
  return { label: "Pending review", className: "bg-amber-500/95 text-white" };
}
