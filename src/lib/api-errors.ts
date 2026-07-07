import "server-only";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Centralized API error handling.
 *
 * Goal: end users must NEVER see raw technical error text (Postgres/Supabase
 * strings, JS TypeErrors, stack traces). Instead we:
 *   1. Log the full technical detail server-side into the `error_reports`
 *      table (admin-only) and to the server console (Vercel logs).
 *   2. Return a short, friendly message to the client.
 *
 * The native iOS/Android apps display the server's `message` verbatim, so
 * returning a friendly `message` here fixes the UI on every platform without
 * an app rebuild.
 */

const GENERIC_USER_MESSAGE =
  "Something went wrong on our end. Please try again in a moment.";

type Jsonish = Record<string, unknown> | null | undefined;

export type FailInput = {
  /** The caught error (any shape). */
  error: unknown;
  /** Friendly, user-safe message to return to the client. */
  userMessage?: string;
  /** HTTP status to return (default 500). */
  status?: number;
  /** Static route identifier, e.g. "/api/mobile/push/register". */
  route?: string;
  /** The incoming Request; used to derive route/method when not provided. */
  req?: Request;
  /** HTTP method (derived from `req` when omitted). */
  method?: string;
  /** Our internal user id, if known. Never an email or token. */
  userId?: string | null;
  /** Client platform if known: "web" | "ios" | "android". */
  source?: string;
  /** Optional non-PII structured context. Do NOT put request bodies here. */
  context?: Jsonish;
};

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max)}…[truncated]` : value;
}

function extractMessage(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || error.name || "Error";
  if (typeof error === "object") {
    const anyErr = error as Record<string, unknown>;
    if (typeof anyErr.message === "string") return anyErr.message;
    try {
      return JSON.stringify(error);
    } catch {
      return "Unserializable error";
    }
  }
  return String(error);
}

function extractCode(error: unknown): string | null {
  if (error && typeof error === "object") {
    const anyErr = error as Record<string, unknown>;
    if (typeof anyErr.code === "string" && anyErr.code) return anyErr.code;
    if (typeof anyErr.name === "string" && anyErr.name && anyErr.name !== "Error")
      return anyErr.name;
  }
  return null;
}

function extractStack(error: unknown): string | null {
  if (error instanceof Error && error.stack) return truncate(error.stack, 8000);
  return null;
}

function deriveRoute(input: FailInput): string | null {
  if (input.route) return input.route;
  if (input.req) {
    try {
      return new URL(input.req.url).pathname;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Persist a server-side error for admin diagnostics. Best-effort: this never
 * throws, so a logging failure can never break the request it is reporting on.
 */
export async function logServerError(input: FailInput): Promise<void> {
  const route = deriveRoute(input);
  const method = input.method ?? input.req?.method ?? null;
  const message = truncate(extractMessage(input.error), 4000);

  // Always surface to server logs too, so errors are visible even if the
  // error_reports table is unavailable (e.g. migration not yet run).
  console.error(`[api-error] ${method ?? ""} ${route ?? "?"} -> ${message}`);

  try {
    const admin = createSupabaseAdminClient() as unknown as {
      from: (t: string) => {
        insert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
      };
    };
    await admin.from("error_reports").insert({
      source: input.source ?? "web",
      route,
      method,
      status: input.status ?? null,
      message,
      code: extractCode(input.error),
      stack: extractStack(input.error),
      user_id: input.userId ?? null,
      context: input.context ?? null,
    });
  } catch (logErr) {
    // Swallow: never let diagnostics logging affect the response.
    console.error("[api-error] failed to persist error_reports row:", logErr);
  }
}

/**
 * Log the technical error and return a safe, user-friendly JSON response.
 * Use this in every API catch block and for unexpected `if (error)` branches.
 *
 * Example:
 *   } catch (error) {
 *     return failJson({ error, req, status: 500,
 *       userMessage: "Couldn't load your bookings. Please try again." });
 *   }
 */
export async function failJson(input: FailInput): Promise<NextResponse> {
  await logServerError(input);
  const status = input.status ?? 500;
  return NextResponse.json(
    { message: input.userMessage ?? GENERIC_USER_MESSAGE },
    { status },
  );
}

export { GENERIC_USER_MESSAGE };
