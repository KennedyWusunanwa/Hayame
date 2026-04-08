import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export async function GET(req: NextRequest) {
  if (process.env.ENABLE_DEBUG_ROUTES !== "1") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Missing id query param" },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const result: {
    env: { hasUrl: boolean; hasAnonKey: boolean };
    rest?: { ok: boolean; status?: number; count?: number; error?: string };
    client?: { ok: boolean; found?: boolean; error?: string };
  } = {
    env: { hasUrl: Boolean(supabaseUrl), hasAnonKey: Boolean(supabaseAnonKey) },
  };

  // REST check
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const params = new URLSearchParams({ id: `eq.${id}`, select: "*" });
      const res = await fetch(
        `${supabaseUrl}/rest/v1/cars?${params.toString()}`,
        {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          cache: "no-store",
        },
      );
      const data = (await res.json()) as
        | Database["public"]["Tables"]["cars"]["Row"][]
        | { message?: string };
      if (Array.isArray(data)) {
        result.rest = { ok: res.ok, status: res.status, count: data.length };
      } else {
        result.rest = {
          ok: res.ok,
          status: res.status,
          count: 0,
          error: (data as any)?.message,
        };
      }
    } catch (error: any) {
      result.rest = { ok: false, error: error?.message ?? "REST fetch failed" };
    }
  }

  // Supabase client check
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    result.client = {
      ok: !error,
      found: Boolean(data),
      error: error?.message,
    };
  } catch (error: any) {
    result.client = {
      ok: false,
      found: false,
      error: error?.message ?? "Client fetch failed",
    };
  }

  return NextResponse.json(result);
}
