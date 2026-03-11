import { headers } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "./admin";

type SupabaseAuthClient = {
  auth: {
    getUser: (jwt?: string) => Promise<{ data?: { user?: User | null } | null }>;
  };
};

function extractBearerToken(value: string | null | undefined) {
  if (!value) return null;
  const [scheme, token] = value.trim().split(/\s+/, 2);
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
}

async function getHeaderAuthorizationFallback() {
  try {
    const headerStore = await headers();
    return headerStore.get("authorization");
  } catch {
    return null;
  }
}

export async function getBearerToken(req?: Request) {
  const fromRequest = extractBearerToken(req?.headers.get("authorization"));
  if (fromRequest) return fromRequest;
  const fromHeaders = extractBearerToken(await getHeaderAuthorizationFallback());
  return fromHeaders;
}

export async function getRequestUser(supabase: SupabaseAuthClient, req?: Request) {
  const cookieSessionUser = await supabase.auth.getUser().catch(() => null);
  const sessionUser = cookieSessionUser?.data?.user ?? null;
  if (sessionUser) return sessionUser;

  const token = await getBearerToken(req);
  if (!token) return null;

  const tokenUser = await supabase.auth.getUser(token).catch(() => null);
  const jwtUser = tokenUser?.data?.user ?? null;
  if (jwtUser) return jwtUser;

  try {
    const adminClient = createSupabaseAdminClient() as any;
    const adminUser = await adminClient.auth.getUser(token);
    return adminUser?.data?.user ?? null;
  } catch {
    return null;
  }
}
