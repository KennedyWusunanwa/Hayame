import Link from "next/link";
import { AdminNotice } from "@/components/admin/admin-notice";
import { AdminSearchForm } from "@/components/admin/admin-search";
import { PageHeader, Panel } from "@/components/admin/admin-ui";
import { requireAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/admin-permissions";
import {
  describePaymentMethod,
  getPaystackBalance,
  getPaystackTotals,
  isPaystackConfigured,
  isPaystackLiveMode,
  listAllPaystackTransactions,
  listPaystackRefunds,
  listPaystackSettlements,
  transactionMetadataValue,
  type PaystackTransaction,
} from "@/lib/paystack-reports";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Tab = "transactions" | "refunds" | "payouts";
type Period = "today" | "7d" | "30d" | "90d" | "all";

const PERIODS: { key: Period; label: string; days: number | null }[] = [
  { key: "today", label: "Today", days: 0 },
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "all", label: "All time", days: null },
];

const STATUSES = ["all", "success", "failed", "abandoned", "reversed"] as const;
type StatusFilter = (typeof STATUSES)[number];
const PAGE_SIZE = 50;

function resolveTab(raw?: string): Tab {
  return raw === "refunds" || raw === "payouts" ? raw : "transactions";
}
function resolvePeriod(raw?: string): Period {
  return PERIODS.some((item) => item.key === raw) ? (raw as Period) : "30d";
}
function resolveStatus(raw?: string): StatusFilter {
  return (STATUSES as readonly string[]).includes(raw ?? "") ? (raw as StatusFilter) : "all";
}

/** Period start in UTC (Ghana is on GMT all year, so UTC days are Ghana days). */
function periodStart(period: Period) {
  const config = PERIODS.find((item) => item.key === period)!;
  if (config.days === null) return undefined;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - config.days);
  return start.toISOString();
}

/** Paystack amounts are in pesewas. */
function money(minor: number | null | undefined) {
  const value = Number(minor ?? 0) / 100;
  return `GH₵${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
/** Booking columns are stored in cedis. */
function cedis(value: number | null | undefined) {
  return `GH₵${Number(value ?? 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function when(value?: string | null) {
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
  });
}

function statusClass(status: string) {
  switch (status) {
    case "success":
    case "processed":
      return "bg-emerald-100 text-emerald-800";
    case "failed":
    case "reversed":
      return "bg-red-100 text-red-800";
    case "abandoned":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-amber-100 text-amber-900";
  }
}

async function safe<T>(work: () => Promise<T>): Promise<{ value: T | null; error: string | null }> {
  try {
    return { value: await work(), error: null };
  } catch (error: any) {
    console.error("[admin/payments] Paystack request failed", error);
    return { value: null, error: String(error?.message ?? "Paystack request failed") };
  }
}

function chunk<T>(items: T[], size: number) {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) out.push(items.slice(index, index + size));
  return out;
}

const BOOKING_SELECT =
  "id,car_id,renter_id,status,payment_status,payment_reference,total_price,start_date,end_date,cars(title)";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; period?: string; status?: string; q?: string; page?: string }>;
}) {
  const me = await requireAdmin("payments.view");
  const params = await searchParams;
  const tab = resolveTab(params.tab);
  const period = resolvePeriod(params.period);
  const status = resolveStatus(params.status);
  const query = (params.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = periodStart(period);
  const periodLabel = PERIODS.find((item) => item.key === period)!.label.toLowerCase();

  const href = (overrides: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    const merged: Record<string, string | number | undefined> = {
      tab,
      period,
      status: status === "all" ? undefined : status,
      q: query || undefined,
      ...overrides,
    };
    Object.entries(merged).forEach(([key, value]) => {
      if (value === undefined || value === "") return;
      next.set(key, String(value));
    });
    return `/admin/payments?${next.toString()}`;
  };

  if (!isPaystackConfigured()) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Trust & money" title="Payments" description="Live figures from Paystack." />
        <AdminNotice tone="error" title="Paystack is not connected" description="Set PAYSTACK_SECRET_KEY on the server to see balances and payments here." />
      </div>
    );
  }

  const admin = createSupabaseAdminClient() as any;
  const [balance, allTimeTotals, periodTransactions, refunds, settlements] = await Promise.all([
    safe(() => getPaystackBalance()),
    safe(() => getPaystackTotals()),
    safe(() => listAllPaystackTransactions({ from })),
    safe(() => listPaystackRefunds({ perPage: 100 })),
    safe(() => listPaystackSettlements({ perPage: 100 })),
  ]);

  const transactions = periodTransactions.value?.transactions ?? [];
  const truncated = periodTransactions.value?.truncated ?? false;
  const paystackError =
    balance.error ?? allTimeTotals.error ?? periodTransactions.error ?? null;

  // --- Match every payment to its booking and renter -----------------------
  const references = Array.from(new Set(transactions.map((tx) => tx.reference).filter(Boolean)));
  const metadataBookingIds = Array.from(
    new Set(
      transactions
        .map((tx) => transactionMetadataValue(tx.metadata, "bookingId"))
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const bookingsByReference = new Map<string, any>();
  const bookingsById = new Map<string, any>();
  const remember = (rows: any[] | null | undefined) =>
    (rows ?? []).forEach((row) => {
      bookingsById.set(String(row.id), row);
      if (row.payment_reference) bookingsByReference.set(String(row.payment_reference), row);
    });
  await Promise.all([
    ...chunk(references, 80).map(async (group) => {
      const { data } = await admin.from("bookings").select(BOOKING_SELECT).in("payment_reference", group);
      remember(data);
    }),
    ...chunk(metadataBookingIds, 80).map(async (group) => {
      const { data } = await admin.from("bookings").select(BOOKING_SELECT).in("id", group);
      remember(data);
    }),
  ]);

  const bookingFor = (tx: PaystackTransaction) =>
    bookingsByReference.get(tx.reference) ??
    bookingsById.get(transactionMetadataValue(tx.metadata, "bookingId") ?? "") ??
    null;
  const renterIdFor = (tx: PaystackTransaction) => {
    const booking = bookingFor(tx);
    return (
      (booking?.renter_id ? String(booking.renter_id) : null) ??
      transactionMetadataValue(tx.metadata, "renterId")
    );
  };

  const renterIds = Array.from(
    new Set(transactions.map(renterIdFor).filter((value): value is string => Boolean(value))),
  );
  const profilesById = new Map<string, any>();
  await Promise.all(
    chunk(renterIds, 80).map(async (group) => {
      const { data } = await admin.from("profiles").select("id,full_name,phone").in("id", group);
      (data ?? []).forEach((row: any) => profilesById.set(String(row.id), row));
    }),
  );

  // --- Period summary -------------------------------------------------------
  const successful = transactions.filter((tx) => tx.status === "success");
  const collected = successful.reduce((sum, tx) => sum + tx.amount, 0);
  const fees = successful.reduce((sum, tx) => sum + Number(tx.fees ?? 0), 0);
  const countBy = (value: string) => transactions.filter((tx) => tx.status === value).length;
  const failedCount = countBy("failed");
  const abandonedCount = countBy("abandoned");
  const reversedCount = countBy("reversed");
  const attempts = transactions.length;
  const successRate = attempts > 0 ? Math.round((successful.length / attempts) * 100) : null;

  const byMethod = new Map<string, { count: number; amount: number }>();
  successful.forEach((tx) => {
    const channel = String(tx.channel ?? "other").replace(/_/g, " ");
    const key = channel.charAt(0).toUpperCase() + channel.slice(1);
    const entry = byMethod.get(key) ?? { count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += tx.amount;
    byMethod.set(key, entry);
  });

  // Paid at Paystack but not showing as a paid booking in Hayame: someone was
  // charged and may have nothing to show for it. These must be looked at.
  const needsAttention = successful.filter((tx) => {
    const booking = bookingFor(tx);
    if (!booking) return true;
    const paymentStatus = String(booking.payment_status ?? "");
    return !["paid", "refunded"].includes(paymentStatus);
  });

  // --- Hayame's own books for the same period -------------------------------
  let ledgerQuery = admin
    .from("bookings")
    .select("status,payment_status,total_price,subtotal,platform_fee,insurance_fee,delivery_fee,outside_accra_surcharge,deposit_amount,paid_at")
    .in("payment_status", ["paid", "refunded", "refund_failed"])
    .not("paid_at", "is", null)
    .limit(5000);
  if (from) ledgerQuery = ledgerQuery.gte("paid_at", from);
  const { data: ledgerRows } = await ledgerQuery;
  const ledger = (ledgerRows ?? []) as any[];
  const kept = ledger.filter((row) => row.payment_status === "paid");
  const sum = (rows: any[], key: string) => rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
  const refundedRows = ledger.filter((row) => row.payment_status === "refunded");
  const refundFailedRows = ledger.filter((row) => row.payment_status === "refund_failed");
  const openDepositRows = kept.filter((row) => ["awaiting_host", "confirmed"].includes(String(row.status)));

  // --- Table rows -----------------------------------------------------------
  const lowered = query.toLowerCase();
  const filtered = transactions.filter((tx) => {
    if (status !== "all" && tx.status !== status) return false;
    if (!lowered) return true;
    const booking = bookingFor(tx);
    const profile = profilesById.get(renterIdFor(tx) ?? "");
    return [
      tx.reference,
      tx.customer?.email,
      profile?.full_name,
      profile?.phone,
      booking?.cars?.title,
      booking?.id,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(lowered));
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const refundRows = refunds.value?.refunds ?? [];
  const settlementRows = settlements.value?.settlements ?? [];
  const canSeeUsers = can(me.role, "users.view");

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "transactions", label: "Transactions", count: filtered.length },
    { key: "refunds", label: "Refunds", count: refunds.value?.meta?.total ?? refundRows.length },
    { key: "payouts", label: "Payouts to bank", count: settlements.value?.meta?.total ?? settlementRows.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Trust & money"
        title="Payments"
        description="Live from Paystack: what is in the balance, every payment and who made it, refunds, and payouts to the bank."
        actions={
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${isPaystackLiveMode() ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
            {isPaystackLiveMode() ? "Live mode" : "Test mode"}
          </span>
        }
      />

      {paystackError ? (
        <AdminNotice
          tone="error"
          title="Some Paystack figures could not be loaded"
          description="Figures marked N/A are missing, not zero. Refresh in a moment; if it keeps happening, check the Paystack key and status page."
        />
      ) : null}

      {needsAttention.length > 0 || refundFailedRows.length > 0 ? (
        <AdminNotice
          tone="error"
          title="Payments that need a person to look at them"
          description={[
            needsAttention.length > 0
              ? `${needsAttention.length} successful payment${needsAttention.length === 1 ? "" : "s"} in this period ${needsAttention.length === 1 ? "is" : "are"} not linked to a paid booking (listed first below, marked "Check").`
              : null,
            refundFailedRows.length > 0
              ? `${refundFailedRows.length} refund${refundFailedRows.length === 1 ? "" : "s"} failed and must be sent manually from Paystack.`
              : null,
          ]
            .filter(Boolean)
            .join(" ")}
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Available balance" value={balance.value ? money(balance.value.balance) : "N/A"} helper="In Paystack now, ready for payout" />
        <Stat label="Waiting for payout" value={allTimeTotals.value ? money(allTimeTotals.value.pendingPayout) : "N/A"} helper="Collected, not yet sent to the bank" />
        <Stat label="Collected, all time" value={allTimeTotals.value ? money(allTimeTotals.value.totalVolume) : "N/A"} helper={allTimeTotals.value ? `${allTimeTotals.value.totalTransactions} successful payment${allTimeTotals.value.totalTransactions === 1 ? "" : "s"}` : "Successful payments"} />
        <Stat label={`Collected, ${periodLabel}`} value={periodTransactions.value ? money(collected) : "N/A"} helper={`${successful.length} successful of ${attempts} attempt${attempts === 1 ? "" : "s"}${successRate === null ? "" : ` (${successRate}%)`}`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Period</span>
        {PERIODS.map((item) => (
          <Link
            key={item.key}
            href={href({ period: item.key, page: undefined })}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${item.key === period ? "border-brand bg-brand text-white" : "border-border bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title={`Paystack, ${periodLabel}`} description="What customers paid and what Paystack kept.">
          <dl className="space-y-2 text-sm">
            <Row label="Collected from customers" value={money(collected)} strong />
            <Row label="Paystack fees" value={`- ${money(fees)}`} />
            <Row label="Net after Paystack fees" value={money(collected - fees)} strong />
            <Row label="Failed payments" value={String(failedCount)} />
            <Row label="Abandoned at checkout" value={String(abandonedCount)} />
            {reversedCount > 0 ? <Row label="Reversed" value={String(reversedCount)} /> : null}
          </dl>
          {byMethod.size > 0 ? (
            <div className="mt-4 border-t border-border/70 pt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">How people paid</p>
              <dl className="mt-2 space-y-1.5 text-sm">
                {Array.from(byMethod.entries())
                  .sort((a, b) => b[1].amount - a[1].amount)
                  .map(([method, entry]) => (
                    <Row key={method} label={`${method} (${entry.count})`} value={money(entry.amount)} />
                  ))}
              </dl>
            </div>
          ) : null}
          {truncated ? (
            <p className="mt-3 text-xs text-amber-800">This period has more than 1,000 payments; totals here cover the newest 1,000. Pick a shorter period for exact figures.</p>
          ) : null}
        </Panel>

        <Panel title={`Hayame bookings, ${periodLabel}`} description="How the money paid in this period breaks down in our own records.">
          <dl className="space-y-2 text-sm">
            <Row label={`Paid bookings (${kept.length})`} value={cedis(sum(kept, "total_price"))} strong />
            <Row label="Rental charges" value={cedis(sum(kept, "subtotal"))} />
            <Row label="Platform fee (Hayame income)" value={cedis(sum(kept, "platform_fee"))} strong />
            <Row label="Insurance" value={cedis(sum(kept, "insurance_fee"))} />
            <Row label="Delivery fees" value={cedis(sum(kept, "delivery_fee"))} />
            <Row label="Outside-region surcharges" value={cedis(sum(kept, "outside_accra_surcharge"))} />
            <Row label="Refundable deposits collected" value={cedis(sum(kept, "deposit_amount"))} />
            <Row label={`Deposits on trips not finished yet (${openDepositRows.length})`} value={cedis(sum(openDepositRows, "deposit_amount"))} />
            <Row label={`Refunded bookings (${refundedRows.length})`} value={cedis(sum(refundedRows, "total_price"))} />
            {refundFailedRows.length > 0 ? (
              <Row label={`Refunds that failed (${refundFailedRows.length})`} value={cedis(sum(refundFailedRows, "total_price"))} />
            ) : null}
          </dl>
        </Panel>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((item) => (
            <Link
              key={item.key}
              href={href({ tab: item.key, page: undefined })}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${item.key === tab ? "border-[#0A2B54] bg-[#0A2B54] text-white" : "border-border bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              {item.label}
              <span className={`ml-2 ${item.key === tab ? "text-white/75" : "text-gray-500"}`}>{item.count}</span>
            </Link>
          ))}
        </div>
        {tab === "transactions" ? (
          <AdminSearchForm
            action="/admin/payments"
            placeholder="Search name, email, reference or car"
            query={query}
            keep={{ tab, period, status: status === "all" ? undefined : status }}
          />
        ) : null}
      </div>

      {tab === "transactions" ? (
        <Panel>
          <div className="mb-4 flex flex-wrap gap-2">
            {STATUSES.map((item) => (
              <Link
                key={item}
                href={href({ status: item === "all" ? undefined : item, page: undefined })}
                className={`rounded-full px-3 py-1 text-xs font-bold capitalize transition ${item === status ? "bg-brand/15 text-brand" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {item === "all" ? "All statuses" : item}
              </Link>
            ))}
          </div>
          {periodTransactions.error ? (
            <p className="text-sm text-red-700">Transactions could not be loaded from Paystack. Refresh to try again.</p>
          ) : visible.length === 0 ? (
            <p className="text-sm text-gray-600">No payments match this period and filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-3 font-semibold">Date (GMT)</th>
                    <th className="py-2 pr-3 font-semibold">Customer</th>
                    <th className="py-2 pr-3 font-semibold">Booking</th>
                    <th className="py-2 pr-3 text-right font-semibold">Amount</th>
                    <th className="py-2 pr-3 text-right font-semibold">Paystack fee</th>
                    <th className="py-2 pr-3 font-semibold">Paid with</th>
                    <th className="py-2 pr-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {[...visible]
                    .sort((a, b) => Number(needsAttention.includes(b)) - Number(needsAttention.includes(a)))
                    .map((tx) => {
                      const booking = bookingFor(tx);
                      const renterId = renterIdFor(tx);
                      const profile = profilesById.get(renterId ?? "");
                      const flagged = needsAttention.includes(tx);
                      const name = profile?.full_name || tx.customer?.email || "Unknown customer";
                      return (
                        <tr key={tx.id || tx.reference} className={flagged ? "bg-red-50/60" : undefined}>
                          <td className="whitespace-nowrap py-2.5 pr-3 align-top text-gray-700">{when(tx.paid_at ?? tx.created_at)}</td>
                          <td className="py-2.5 pr-3 align-top">
                            {renterId && canSeeUsers ? (
                              <Link href={`/admin/users/${renterId}`} className="font-semibold text-[#0A2B54] hover:underline">
                                {name}
                              </Link>
                            ) : (
                              <span className="font-semibold text-foreground">{name}</span>
                            )}
                            <p className="text-xs text-gray-500">{tx.customer?.email ?? "No email"}</p>
                          </td>
                          <td className="py-2.5 pr-3 align-top">
                            {booking ? (
                              <>
                                <p className="text-foreground">{booking.cars?.title ?? "Car"}</p>
                                <p className="text-xs text-gray-500">
                                  {String(booking.id).slice(0, 8).toUpperCase()} · {String(booking.status).replace(/_/g, " ")} · {booking.start_date} to {booking.end_date}
                                </p>
                              </>
                            ) : (
                              <span className="text-xs text-gray-500">{tx.status === "success" ? "No booking found" : "No booking"}</span>
                            )}
                            <p className="mt-0.5 break-all font-mono text-[11px] text-gray-400">{tx.reference}</p>
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-right align-top font-semibold text-foreground">{money(tx.amount)}</td>
                          <td className="whitespace-nowrap py-2.5 pr-3 text-right align-top text-gray-600">{tx.status === "success" && tx.fees !== null ? money(tx.fees) : "N/A"}</td>
                          <td className="py-2.5 pr-3 align-top text-gray-700">{describePaymentMethod(tx)}</td>
                          <td className="py-2.5 pr-3 align-top">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${statusClass(tx.status)}`}>{tx.status}</span>
                            {flagged ? <p className="mt-1 text-xs font-bold text-red-700">Check: {booking ? `booking is "${String(booking.payment_status ?? "unpaid")}"` : "no booking"}</p> : null}
                            {tx.status !== "success" && tx.gateway_response ? <p className="mt-1 max-w-[180px] text-xs text-gray-500">{tx.gateway_response}</p> : null}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
          {pageCount > 1 ? (
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-gray-600">
                Page {currentPage} of {pageCount} · {filtered.length} payments
              </p>
              <div className="flex gap-2">
                {currentPage > 1 ? (
                  <Link href={href({ page: currentPage - 1 })} className="rounded-lg border border-border bg-white px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50">
                    Previous
                  </Link>
                ) : null}
                {currentPage < pageCount ? (
                  <Link href={href({ page: currentPage + 1 })} className="rounded-lg border border-border bg-white px-3 py-1.5 font-semibold text-gray-700 hover:bg-gray-50">
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {tab === "refunds" ? (
        <Panel description="Refunds sent back to customers through Paystack (newest 100).">
          {refunds.error ? (
            <p className="text-sm text-red-700">Refunds could not be loaded from Paystack. Refresh to try again.</p>
          ) : refundRows.length === 0 ? (
            <p className="text-sm text-gray-600">No refunds have been made.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-3 font-semibold">Date (GMT)</th>
                    <th className="py-2 pr-3 font-semibold">Payment reference</th>
                    <th className="py-2 pr-3 text-right font-semibold">Amount</th>
                    <th className="py-2 pr-3 font-semibold">Status</th>
                    <th className="py-2 pr-3 font-semibold">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {refundRows.map((refund) => (
                    <tr key={refund.id}>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-gray-700">{when(refund.refunded_at ?? refund.created_at)}</td>
                      <td className="break-all py-2.5 pr-3 font-mono text-xs text-gray-600">{refund.transaction_reference ?? "N/A"}</td>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-right font-semibold">{money(refund.amount)}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${statusClass(String(refund.status ?? "pending"))}`}>{refund.status ?? "pending"}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-gray-600">{refund.merchant_note ?? refund.customer_note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : null}

      {tab === "payouts" ? (
        <Panel description="Money Paystack has sent, or is about to send, to the Hayame bank account (newest 100).">
          {settlements.error ? (
            <p className="text-sm text-red-700">Payouts could not be loaded from Paystack. Refresh to try again.</p>
          ) : settlementRows.length === 0 ? (
            <p className="text-sm text-gray-600">
              No payouts yet.{allTimeTotals.value && allTimeTotals.value.pendingPayout > 0 ? ` ${money(allTimeTotals.value.pendingPayout)} is waiting for the next payout.` : ""}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-3 font-semibold">Payout date (GMT)</th>
                    <th className="py-2 pr-3 text-right font-semibold">Collected</th>
                    <th className="py-2 pr-3 text-right font-semibold">Fees</th>
                    <th className="py-2 pr-3 text-right font-semibold">Sent to bank</th>
                    <th className="py-2 pr-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {settlementRows.map((settlement) => (
                    <tr key={settlement.id}>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-gray-700">{when(settlement.settlement_date ?? settlement.created_at)}</td>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-right">{settlement.total_processed !== null ? money(settlement.total_processed) : "N/A"}</td>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-right text-gray-600">{settlement.total_fees !== null ? money(settlement.total_fees) : "N/A"}</td>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-right font-semibold">{money(settlement.effective_amount ?? settlement.total_amount)}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${statusClass(String(settlement.status ?? "pending"))}`}>{settlement.status ?? "pending"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : null}
    </div>
  );
}

function Stat({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{helper}</p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-gray-600">{label}</dt>
      <dd className={`whitespace-nowrap ${strong ? "font-bold text-foreground" : "text-gray-800"}`}>{value}</dd>
    </div>
  );
}
