// Client-side error sanitizer — the browser counterpart to the server's failJson().
//
// Rule: NEVER show a raw caught-error message to the user. Network failures
// ("Failed to fetch", "Load failed", "NetworkError"), JSON parse errors, and direct
// Supabase/Postgres/GoTrue errors all carry developer-facing text. Only surface a
// message we can vouch for: a short, clean string our own code constructed (e.g. from a
// sanitized `data.message` we read out of one of our API responses). Everything else
// becomes a friendly fallback.

export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";
export const NETWORK_ERROR_MESSAGE =
  "Poor network. Please check your connection and try again.";

// Substrings that mark a string as raw/technical and therefore never displayable.
const TECHNICAL_MARKERS = [
  "failed to fetch",
  "networkerror",
  "load failed",
  "unexpected token",
  "is not valid json",
  "json.parse",
  "violates",
  "constraint",
  "duplicate key",
  "null value",
  "column ",
  "relation ",
  "syntax error",
  "sqlstate",
  "postgres",
  "pgrst",
  "row-level security",
  "permission denied",
  "jwt",
  "flow state",
  "econnrefused",
  "enotfound",
  "etimedout",
  "://",
];

function looksTechnical(message: string): boolean {
  if (message.length > 160 || /[\n<{]/.test(message)) return true;
  const lowered = message.toLowerCase();
  return TECHNICAL_MARKERS.some((marker) => lowered.includes(marker));
}

/**
 * Convert any caught value into a safe, user-facing message.
 * - `fetch` network failures (a `TypeError`) → a friendly connectivity message.
 * - A thrown `Error` whose message is short and non-technical (e.g. one we built from a
 *   sanitized API `data.message`) → that message.
 * - Everything else (Supabase/Postgres objects, parse errors, unknowns) → `fallback`.
 */
export function friendlyError(
  err: unknown,
  fallback: string = GENERIC_ERROR_MESSAGE,
): string {
  // A failed fetch rejects with a TypeError ("Failed to fetch"/"Load failed").
  if (err instanceof TypeError) return NETWORK_ERROR_MESSAGE;
  if (err && typeof err === "object" && "message" in err) {
    const message = String((err as { message?: unknown }).message ?? "").trim();
    if (message && !looksTechnical(message)) return message;
  }
  return fallback;
}
