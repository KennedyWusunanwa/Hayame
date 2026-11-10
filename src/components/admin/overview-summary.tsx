import Link from "next/link";
import type { ReactNode } from "react";
import { can, type AdminRole } from "@/lib/admin-permissions";
import {
  getPaystackBalance,
  getPaystackTotals,
  isPaystackConfigured,
} from "@/lib/paystack-reports";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// The "everything at a glance" block at the top of the admin dashboard:
// what needs a decision now, then totals for people, vehicles, bookings and
// money. Every figure is counted in the database (or read from Paystack) at
// request time; a figure that could not be loaded shows "N/A", never a zero.

type Count = number | null;

function cedis(value: number | null) {
  if (value === null) return "N/A";
  return `GH₵${value.toLocaleString("en-GH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function show(value: Count) {
  return value === null ? "N/A" : value.toLocaleString("en-GH");
}

export async function AdminOverviewSummary({ role }: { role: AdminRole }) {
  const db = createSupabaseAdminClient() as any;

  const count = async (
    table: string,
    apply?: (query: any) => any,
  ): Promise<Count> => {
    try {
      let query = db.from(table).select("id", { count: "exact", head: true });
      if (apply) query = apply(query);
      const { count: total, error } = await query;
      if (error) return null;
      return total ?? 0;
    } catch {
      return null;
    }
  };

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const bookingStatus = (status: string) => count("bookings", (q) => q.eq("status", status));
  const seeMoney = can(role, "payments.view");

  const [
    users,
    newUsers,
    hosts,
    verifiedRenters,
    pendingVerifications,
    pendingHostApplications,
    cars,
    carsLive,
    carsPending,
    carsRejected,
    carsPaused,
    bookings,
    awaitingHost,
    confirmed,
    completed,
    cancelled,
    rejected,
    refunded,
    tripsInProgress,
    upcomingTrips,
    openDisputes,
    refundsFailed,
  ] = await Promise.all([
    count("profiles"),
    count("profiles", (q) => q.gte("created_at", weekAgo)),
    count("profiles", (q) => q.eq("is_host", true)),
    count("renter_verifications", (q) => q.eq("status", "approved")),
    count("renter_verifications", (q) => q.eq("status", "pending")),
    count("host_applications", (q) => q.eq("status", "pending")),
    count("cars"),
    count("cars", (q) => q.eq("approval_status", "approved").neq("is_available", false)),
    count("cars", (q) => q.eq("approval_status", "pending")),
    count("cars", (q) => q.eq("approval_status", "rejected")),
    count("cars", (q) => q.eq("approval_status", "approved").eq("is_available", false)),
    // Unpaid checkout holds are not bookings yet, so they are left out.
    count("bookings", (q) => q.in("payment_status", ["paid", "refunded", "refund_failed"])),
    bookingStatus("awaiting_host"),
    bookingStatus("confirmed"),
    bookingStatus("completed"),
    count("bookings", (q) => q.eq("status", "cancelled").in("payment_status", ["paid", "refunded", "refund_failed"])),
    bookingStatus("rejected"),
    bookingStatus("refunded"),
    count("bookings", (q) => q.eq("status", "confirmed").lte("start_date", todayIso).gte("end_date", todayIso)),
    count("bookings", (q) => q.eq("status", "confirmed").gt("start_date", todayIso)),
    count("disputes", (q) => q.in("status", ["open", "under_review"])),
    count("bookings", (q) => q.eq("payment_status", "refund_failed")),
  ]);

  // Money: Hayame's own records, plus the live Paystack balance.
  let ledger: any[] | null = null;
  let balance: number | null = null;
  let pendingPayout: number | null = null;
  if (seeMoney) {
    const [ledgerResult, balanceResult, totalsResult] = await Promise.all([
      db
        .from("bookings")
        .select("status,payment_status,total_price,platform_fee,deposit_amount,paid_at")
        .in("payment_status", ["paid", "refunded"])
        .limit(10000)
        .then((result: any) => result, () => ({ data: null, error: true })),
      isPaystackConfigured() ? getPaystackBalance().catch(() => null) : Promise.resolve(null),
      isPaystackConfigured() ? getPaystackTotals().catch(() => null) : Promise.resolve(null),
    ]);
    ledger = ledgerResult?.error ? null : ((ledgerResult?.data ?? []) as any[]);
    balance = balanceResult ? balanceResult.balance / 100 : null;
    pendingPayout = totalsResult ? totalsResult.pendingPayout / 100 : null;
  }
  const paid = ledger?.filter((row) => row.payment_status === "paid") ?? null;
  const total = (rows: any[] | null, key: string, since?: string) =>
    rows === null
      ? null
      : rows
          .filter((row) => !since || (row.paid_at && String(row.paid_at) >= since))
          .reduce((sum, row) => sum + Number(row[key] ?? 0), 0);
  const refundedValue =
    ledger === null
      ? null
      : ledger
          .filter((row) => row.payment_status === "refunded")
          .reduce((sum, row) => sum + Number(row.total_price ?? 0), 0);
  const depositsHeld =
    paid === null
      ? null
      : paid
          .filter((row) => ["awaiting_host", "confirmed"].includes(String(row.status)))
          .reduce((sum, row) => sum + Number(row.deposit_amount ?? 0), 0);

  const canReview = can(role, "applications.review");
  const queue: { label: string; value: Count; href: string; show: boolean }[] = [
    { label: "Renters to verify", value: pendingVerifications, href: "/admin/verifications", show: canReview },
    { label: "Host applications", value: pendingHostApplications, href: "/admin?tab=applications&status=pending", show: canReview },
    { label: "Listings to review", value: carsPending, href: "/admin/platform", show: can(role, "vehicles.review") },
    { label: "Open disputes", value: openDisputes, href: "/admin/platform", show: can(role, "disputes.resolve") },
    { label: "Failed refunds", value: refundsFailed, href: "/admin/payments", show: seeMoney },
  ].filter((item) => item.show);
  const waiting = queue.reduce((sum, item) => sum + (item.value ?? 0), 0);

  return (
    <section className="space-y-4" aria-label="Summary of everything">
      {queue.length > 0 ? (
        <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-bold text-[#0A2B54]">Needs a decision</h2>
            <p className="text-sm text-gray-600">
              {waiting === 0 ? "Nothing is waiting on you." : `${waiting} item${waiting === 1 ? "" : "s"} waiting.`}
            </p>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {queue.map((item) => {
              const hot = (item.value ?? 0) > 0;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-xl border p-3 transition hover:-translate-y-0.5 ${hot ? "border-amber-300 bg-amber-50" : "border-border bg-gray-50"}`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${hot ? "text-amber-900" : "text-gray-500"}`}>{item.label}</p>
                  <p className="mt-1.5 text-2xl font-semibold text-foreground">{show(item.value)}</p>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        <Group title="People" href={can(role, "users.view") ? "/admin?tab=users" : undefined}>
          <Line label="All users" value={show(users)} strong />
          <Line label="Joined in the last 7 days" value={show(newUsers)} />
          <Line label="Hosts" value={show(hosts)} />
          <Line label="Renters verified to book" value={show(verifiedRenters)} />
          <Line label="Renters waiting for review" value={show(pendingVerifications)} />
        </Group>

        <Group title="Vehicles" href={can(role, "vehicles.review") ? "/admin?tab=vehicles" : undefined}>
          <Line label="All listings" value={show(cars)} strong />
          <Line label="Live and bookable" value={show(carsLive)} />
          <Line label="Waiting for review" value={show(carsPending)} />
          <Line label="Approved but switched off" value={show(carsPaused)} />
          <Line label="Rejected" value={show(carsRejected)} />
        </Group>

        <Group title="Bookings">
          <Line label="All paid bookings" value={show(bookings)} strong />
          <Line label="Waiting for host approval" value={show(awaitingHost)} />
          <Line label="Confirmed" value={show(confirmed)} />
          <Line label="Trips happening today" value={show(tripsInProgress)} />
          <Line label="Upcoming trips" value={show(upcomingTrips)} />
          <Line label="Completed" value={show(completed)} />
          <Line label="Cancelled after paying" value={show(cancelled)} />
          <Line label="Declined by host" value={show(rejected)} />
          <Line label="Refunded" value={show(refunded)} />
        </Group>

        {seeMoney ? (
          <Group title="Money" href="/admin/payments">
            <Line label="Paid for bookings, all time" value={cedis(total(paid, "total_price"))} strong />
            <Line label="Paid this month" value={cedis(total(paid, "total_price", monthStart))} />
            <Line label="Paid today" value={cedis(total(paid, "total_price", dayStart))} />
            <Line label="Platform fees earned" value={cedis(total(paid, "platform_fee"))} strong />
            <Line label="Deposits held on open trips" value={cedis(depositsHeld)} />
            <Line label="Refunded to renters" value={cedis(refundedValue)} />
            <Line label="Paystack balance" value={cedis(balance)} />
            <Line label="Waiting for payout" value={cedis(pendingPayout)} />
          </Group>
        ) : null}
      </div>
    </section>
  );
}

function Group({ title, href, children }: { title: string; href?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-[#0A2B54]">{title}</h2>
        {href ? (
          <Link href={href} className="text-xs font-semibold text-brand">
            Open
          </Link>
        ) : null}
      </div>
      <dl className="space-y-2 text-sm">{children}</dl>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-gray-600">{label}</dt>
      <dd className={`whitespace-nowrap ${strong ? "text-base font-bold text-foreground" : "font-semibold text-gray-800"}`}>{value}</dd>
    </div>
  );
}

export function AdminOverviewSummarySkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4" aria-hidden="true">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="h-56 animate-pulse rounded-2xl border border-border/80 bg-white p-5 shadow-sm">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2, 3, 4].map((line) => (
              <div key={line} className="h-3 rounded bg-gray-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
