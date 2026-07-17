import Link from "next/link";
import { AdminNotice } from "@/components/admin/admin-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { FUNNEL_STEPS } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Overview = {
  total_events: number;
  unique_visitors: number;
  searches: number;
  car_views: number;
  bookings_started: number;
  bookings_completed: number;
  zero_result_searches: number;
  web_events: number;
  ios_events: number;
};

type FunnelRow = { step: string; sessions: number };
type AbandonRow = { reason: string; count: number };
type TrendRow = { day: string; visitors: number; searches: number; bookings: number };
type ConsentRow = { granted: number; denied: number };
type SearchTermRow = { term: string; searches: number; searchers: number };
type ZeroResultRow = { term: string; region: string | null; searches: number };

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

function resolveRange(raw?: string): Range {
  const parsed = Number(raw);
  return (RANGES as readonly number[]).includes(parsed) ? (parsed as Range) : 30;
}

function isMissingObjectError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const text = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return (
    text.includes("does not exist") ||
    text.includes("could not find") ||
    text.includes("schema cache") ||
    error.code === "42p01" ||
    error.code === "42883"
  );
}

const STEP_LABELS: Record<string, string> = {
  search: "Searched",
  car_view: "Viewed a car",
  booking_started: "Started booking",
  booking_dates_selected: "Picked dates",
  booking_payment_started: "Reached payment",
  booking_completed: "Completed booking",
};

const REASON_LABELS: Record<string, string> = {
  not_signed_in: "Bounced to sign-in mid-booking",
  closed_payment_modal: "Closed the payment window",
  failed_after_payment: "Paid but booking failed",
  unknown: "Unknown",
};

function pct(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const days = resolveRange(params.range);

  const admin = createSupabaseAdminClient() as any;

  const [
    overviewRes,
    funnelRes,
    abandonRes,
    trendRes,
    consentRes,
    termsRes,
    zeroRes,
  ] = await Promise.all([
    admin.rpc("analytics_overview", { days_back: days }),
    admin.rpc("analytics_funnel", { days_back: days }),
    admin.rpc("analytics_abandon_reasons", { days_back: days }),
    admin.rpc("analytics_daily_trend", { days_back: days }),
    admin.rpc("analytics_consent_stats", { days_back: days }),
    admin
      .from("analytics_search_terms")
      .select("term, searches, searchers")
      .order("searches", { ascending: false })
      .limit(15),
    admin
      .from("analytics_zero_result_searches")
      .select("term, region, searches")
      .order("searches", { ascending: false })
      .limit(15),
  ]);

  // The migration may not have been run yet. Say so plainly rather than
  // rendering a dashboard full of zeroes that looks like real "no traffic" data.
  const migrationMissing = [
    overviewRes.error,
    funnelRes.error,
    termsRes.error,
  ].some(isMissingObjectError);

  const overview: Overview | null = Array.isArray(overviewRes.data)
    ? (overviewRes.data[0] ?? null)
    : (overviewRes.data ?? null);
  const funnel: FunnelRow[] = funnelRes.data ?? [];
  const abandons: AbandonRow[] = abandonRes.data ?? [];
  const trend: TrendRow[] = trendRes.data ?? [];
  const consent: ConsentRow | null = Array.isArray(consentRes.data)
    ? (consentRes.data[0] ?? null)
    : (consentRes.data ?? null);
  const terms: SearchTermRow[] = termsRes.data ?? [];
  const zeroResults: ZeroResultRow[] = zeroRes.data ?? [];

  const funnelTop = funnel[0]?.sessions ?? 0;
  const consentTotal = (consent?.granted ?? 0) + (consent?.denied ?? 0);
  const peakVisitors = Math.max(1, ...trend.map((row) => row.visitors));

  return (
    <div className="min-h-screen bg-[#f5f8fc]">
      <div className="mx-auto max-w-[1500px] space-y-6 px-3 py-4 sm:px-6 lg:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">
              First-party marketplace analytics. Counts reflect visitors who
              accepted analytics — see the consent card below for coverage.
            </p>
          </div>
          <div className="flex gap-2">
            {RANGES.map((value) => (
              <Link
                key={value}
                href={`/admin/analytics?range=${value}`}
                className={cn(
                  "min-h-10 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                  value === days
                    ? "border-brand bg-brand text-white shadow-sm"
                    : "border-border bg-white text-gray-700 hover:bg-gray-50",
                )}
              >
                {value}d
              </Link>
            ))}
          </div>
        </div>

        {migrationMissing ? (
          <AdminNotice
            tone="error"
            title="Analytics tables not created yet"
            description="Run db/analytics.sql in the Supabase SQL editor. Until then this page has nothing to read and every number below will show zero."
          />
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Unique visitors"
            value={overview?.unique_visitors ?? 0}
            hint={`Last ${days} days`}
          />
          <Stat
            label="Searches"
            value={overview?.searches ?? 0}
            hint={`${overview?.zero_result_searches ?? 0} returned nothing`}
          />
          <Stat label="Car views" value={overview?.car_views ?? 0} />
          <Stat
            label="Bookings completed"
            value={overview?.bookings_completed ?? 0}
            hint={
              overview
                ? `${pct(overview.bookings_completed, overview.bookings_started)} of started bookings`
                : undefined
            }
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Booking funnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {funnelTop === 0 ? (
                <p className="text-sm text-gray-500">No funnel data yet.</p>
              ) : (
                FUNNEL_STEPS.map((step) => {
                  const row = funnel.find((item) => item.step === step);
                  const sessions = row?.sessions ?? 0;
                  const share = funnelTop ? (sessions / funnelTop) * 100 : 0;
                  return (
                    <div key={step} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">
                          {STEP_LABELS[step] ?? step}
                        </span>
                        <span className="tabular-nums text-gray-600">
                          {sessions}{" "}
                          <span className="text-gray-400">
                            ({pct(sessions, funnelTop)})
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-brand transition-all"
                          style={{ width: `${Math.max(share, 1)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Why bookings drop off</CardTitle>
            </CardHeader>
            <CardContent>
              {abandons.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No abandoned bookings recorded yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {abandons.map((row) => (
                    <li
                      key={row.reason}
                      className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2 text-sm"
                    >
                      <span className="text-gray-700">
                        {REASON_LABELS[row.reason] ?? row.reason}
                      </span>
                      <span className="font-semibold tabular-nums text-gray-900">
                        {row.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>What people search for</CardTitle>
            </CardHeader>
            <CardContent>
              {terms.length === 0 ? (
                <p className="text-sm text-gray-500">No searches recorded yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {terms.map((row) => (
                    <li
                      key={row.term}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate text-gray-700">{row.term}</span>
                      <span className="ml-3 shrink-0 tabular-nums text-gray-500">
                        {row.searches}{" "}
                        <span className="text-gray-400">
                          / {row.searchers} people
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Searches that found nothing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-gray-500">
                Demand you cannot currently supply. Each row is someone who
                wanted a car you do not list.
              </p>
              {zeroResults.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No empty searches recorded yet.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {zeroResults.map((row) => (
                    <li
                      key={`${row.term}-${row.region ?? "all"}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate text-gray-700">
                        {row.term}
                        {row.region ? (
                          <span className="text-gray-400"> · {row.region}</span>
                        ) : null}
                      </span>
                      <span className="ml-3 shrink-0 tabular-nums text-gray-500">
                        {row.searches}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Daily visitors</CardTitle>
            </CardHeader>
            <CardContent>
              {trend.length === 0 ? (
                <p className="text-sm text-gray-500">No traffic recorded yet.</p>
              ) : (
                <div className="flex h-40 items-end gap-1">
                  {trend.map((row) => (
                    <div
                      key={row.day}
                      className="group relative flex-1"
                      title={`${row.day}: ${row.visitors} visitors, ${row.searches} searches, ${row.bookings} bookings`}
                    >
                      <div
                        className="w-full rounded-t bg-brand/80 transition-all group-hover:bg-brand"
                        style={{
                          height: `${Math.max((row.visitors / peakVisitors) * 150, 2)}px`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consent &amp; coverage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Accepted analytics</span>
                <span className="font-semibold tabular-nums">
                  {consent?.granted ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Declined</span>
                <span className="font-semibold tabular-nums">
                  {consent?.denied ?? 0}
                </span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-2">
                <span className="text-gray-600">Opt-in rate</span>
                <span className="font-semibold tabular-nums">
                  {pct(consent?.granted ?? 0, consentTotal)}
                </span>
              </div>
              <p className="pt-1 text-xs leading-relaxed text-gray-500">
                Everything on this page counts only visitors who accepted. Real
                traffic is higher than the numbers shown.
              </p>
              <div className="flex justify-between border-t border-border/60 pt-2">
                <span className="text-gray-600">Web events</span>
                <span className="font-semibold tabular-nums">
                  {overview?.web_events ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">iOS events</span>
                <span className="font-semibold tabular-nums">
                  {overview?.ios_events ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="pb-4 text-center text-xs text-gray-400">
          First-party data only. No advertising trackers, no cross-app tracking,
          no data sold. Raw events are deleted after 400 days.
        </p>
      </div>
    </div>
  );
}
