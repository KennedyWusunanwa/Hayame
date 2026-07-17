/**
 * Shared analytics event taxonomy (web + iOS).
 *
 * Design rule: this file is an ALLOWLIST, not a suggestion. The ingest route
 * rejects any event name or property key not listed here. That is deliberate —
 * it means a future contributor cannot accidentally start sending emails, phone
 * numbers, or ID numbers into the analytics table just by adding a `track()`
 * call. If you need a new event, add it here first and think about the data.
 *
 * What belongs here: things people DO in Hayame's own marketplace.
 * What does not: anything identifying a person (name, email, phone, ID number,
 * precise location, payment details), and anything about their behaviour on
 * another company's app or website.
 *
 * See db/analytics.sql for the storage-side privacy posture.
 */

export const ANALYTICS_EVENTS = [
  // Discovery
  "page_view",
  "search",
  "search_filter_applied",
  "car_view",
  "car_photos_opened",
  "car_favorited",
  "car_unfavorited",

  // Booking funnel (ordered — see FUNNEL_STEPS below)
  "booking_started",
  "booking_dates_selected",
  "booking_payment_started",
  "booking_completed",
  "booking_abandoned",

  // Account
  "signup_started",
  "signup_completed",
  "login_completed",

  // Host supply side
  "host_application_started",
  "host_application_submitted",
  "car_listing_started",
  "car_listing_published",

  // Engagement
  "message_sent",
  "review_submitted",
  "contact_form_submitted",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/**
 * The conversion funnel, in order. The admin dashboard computes drop-off by
 * counting distinct sessions that reached each step.
 */
export const FUNNEL_STEPS: AnalyticsEventName[] = [
  "search",
  "car_view",
  "booking_started",
  "booking_dates_selected",
  "booking_payment_started",
  "booking_completed",
];

/**
 * Allowlisted property keys. Anything else is stripped at ingest.
 *
 * Note what is absent by design: no `email`, no `phone`, no `name`, no `lat`,
 * no `lng`, no `ip`, no `amount` (we bucket instead — see priceBucket).
 */
export const ALLOWED_PROP_KEYS = [
  "car_id",       // our own listing id
  "q",            // search text, truncated at ingest
  "region",       // Ghana region name (from our static list)
  "city",         // city name (from our static list)
  "results",      // integer: how many results a search returned
  "filters",      // short string: which filters were active
  "days",         // integer: trip length
  "price_bucket", // string bucket, never an exact amount
  "step",         // string: which step of a multi-step form
  "reason",       // string: why something was abandoned
  "source",       // string: which surface the action came from
  "position",     // integer: rank in a result list
] as const;

export type AnalyticsProps = Partial<
  Record<(typeof ALLOWED_PROP_KEYS)[number], string | number | boolean | null>
>;

/**
 * Keys that MUST be stored as JSON numbers.
 *
 * The admin views cast these in SQL — e.g. `(props ->> 'results')::int` in
 * analytics_zero_result_searches. Postgres casts are all-or-nothing per query,
 * so a single row holding the string "abc" here would make that view throw for
 * every row, not just the bad one. A public endpoint means anyone can post that
 * string, so it is coerced at the door rather than trusted.
 */
const NUMERIC_PROP_KEYS = new Set<string>(["results", "days", "position"]);

/**
 * Bucket a cedi amount instead of storing it exactly.
 *
 * Exact amounts already live in `bookings` where they belong. Analytics only
 * needs the shape of demand, so buckets give us the same insight with less
 * personal data — which is what data minimisation actually asks for.
 */
export function priceBucket(amountGhs: number | null | undefined): string {
  if (amountGhs == null || !Number.isFinite(amountGhs)) return "unknown";
  if (amountGhs < 200) return "0-199";
  if (amountGhs < 500) return "200-499";
  if (amountGhs < 1000) return "500-999";
  if (amountGhs < 2000) return "1000-1999";
  if (amountGhs < 5000) return "2000-4999";
  return "5000+";
}

export function isAnalyticsEvent(value: string): value is AnalyticsEventName {
  return (ANALYTICS_EVENTS as readonly string[]).includes(value);
}

/** Strip any key not on the allowlist, and clamp value sizes. */
export function sanitizeProps(input: unknown): AnalyticsProps {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, string | number | boolean | null> = {};
  for (const key of ALLOWED_PROP_KEYS) {
    const value = (input as Record<string, unknown>)[key];
    if (value === undefined) continue;

    if (NUMERIC_PROP_KEYS.has(key)) {
      // Coerce or drop. Never let a non-number reach a column the SQL views cast.
      const parsed = typeof value === "number" ? value : Number(value);
      out[key] = Number.isFinite(parsed) ? Math.trunc(parsed) : null;
      continue;
    }

    if (value === null || typeof value === "boolean") {
      out[key] = value;
    } else if (typeof value === "number") {
      out[key] = Number.isFinite(value) ? value : null;
    } else if (typeof value === "string") {
      // Truncate: search text is the only free-form field, and 120 chars is
      // plenty for a car search while capping what a paste can smuggle in.
      out[key] = value.slice(0, 120);
    }
  }
  return out as AnalyticsProps;
}
