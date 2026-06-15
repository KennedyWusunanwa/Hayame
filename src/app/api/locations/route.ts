import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fallbackCities } from "@/lib/utils";

type LocationsPayload = { data: Record<string, string[]>; message?: string };

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
};
const SERVER_CACHE_TTL_MS = 10 * 60 * 1000;

let cachedPayload: { expiresAt: number; payload: LocationsPayload } | null =
  null;

function fallbackLocations(): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  fallbackCities.forEach((c) => {
    if (!grouped[c.region]) grouped[c.region] = [];
    grouped[c.region].push(c.city);
  });
  return grouped;
}

export async function GET(req: Request) {
  const strict = new URL(req.url).searchParams.get("strict") === "true";
  if (!strict && cachedPayload && cachedPayload.expiresAt > Date.now()) {
    return NextResponse.json(cachedPayload.payload, { headers: CACHE_HEADERS });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const [regionsResult, districtsResult] = await Promise.all([
      supabase.from("gh_regions").select("id,name").order("name"),
      supabase.from("gh_districts").select("name,region_id").order("name"),
    ]);

    const { data: regionsData, error: regionError } = regionsResult;
    if (regionError) throw regionError;
    if (!regionsData || regionsData.length === 0) {
      throw new Error("No regions found");
    }

    const { data: districtsData, error: districtError } = districtsResult;
    if (districtError) throw districtError;

    const regionMap = new Map<number, string>();
    regionsData.forEach((r: any) => regionMap.set(r.id, r.name));

    const locations =
      districtsData?.map((d: any) => ({
        region: regionMap.get(d.region_id) ?? "",
        city: d.name,
      })) ?? [];

    const grouped: Record<string, string[]> = {};
    locations.forEach((loc) => {
      if (!loc.region) return;
      if (!grouped[loc.region]) grouped[loc.region] = [];
      grouped[loc.region].push(loc.city);
    });

    const payload = { data: grouped };
    if (!strict) {
      cachedPayload = {
        expiresAt: Date.now() + SERVER_CACHE_TTL_MS,
        payload,
      };
    }

    return NextResponse.json(payload, { headers: CACHE_HEADERS });
  } catch {
    if (strict) {
      return NextResponse.json(
        { message: "Failed to load locations" },
        { status: 500 },
      );
    }
    // Fallback to static list so UI still works
    const payload = {
      data: fallbackLocations(),
      message: "Using fallback locations",
    };
    return NextResponse.json(payload, { headers: CACHE_HEADERS });
  }
}
