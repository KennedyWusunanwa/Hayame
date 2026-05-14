import { NextResponse } from "next/server";

const ALLOWED_TARGET_SCHEMES = new Set([
  "hayame",
  "hayameios",
  "hayameandroid",
]);

function sanitizeTargetPath(raw: string | null) {
  const trimmed = raw?.trim().replace(/^\/+/, "") || "payment-callback";
  return /^[a-zA-Z0-9/_-]+$/.test(trimmed) ? trimmed : "payment-callback";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("target")?.trim().toLowerCase();
  const scheme = target && ALLOWED_TARGET_SCHEMES.has(target) ? target : "hayame";
  const path = sanitizeTargetPath(url.searchParams.get("path"));
  const reference =
    url.searchParams.get("reference") ??
    url.searchParams.get("trxref") ??
    url.searchParams.get("reference_id") ??
    "";
  const trxref = url.searchParams.get("trxref") ?? reference;
  const status = url.searchParams.get("status") ?? "";

  const callback = new URL(`${scheme}://${path}`);
  if (reference) callback.searchParams.set("reference", reference);
  if (trxref) callback.searchParams.set("trxref", trxref);
  if (status) callback.searchParams.set("status", status);

  return NextResponse.redirect(callback.toString(), 302);
}
