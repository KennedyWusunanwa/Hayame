import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fallbackCities } from "@/lib/utils";

export async function GET(req: Request) {
  const strict = new URL(req.url).searchParams.get("strict") === "true";
  try {
    const supabase = await createSupabaseServerClient();
    const { data: regionsData, error: regionError } = await supabase
      .from("gh_regions")
      .select("id,name")
      .order("name");

    if (regionError) throw regionError;
    if (!regionsData || regionsData.length === 0) {
      throw new Error("No regions found");
    }

    const { data: districtsData, error: districtError } = await supabase
      .from("gh_districts")
      .select("name,region_id")
      .order("name");
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

    return NextResponse.json({ data: grouped });
  } catch {
    if (strict) {
      return NextResponse.json(
        { message: "Failed to load locations" },
        { status: 500 },
      );
    }
    // Fallback to static list so UI still works
    const grouped: Record<string, string[]> = {};
    fallbackCities.forEach((c) => {
      if (!grouped[c.region]) grouped[c.region] = [];
      grouped[c.region].push(c.city);
    });
    return NextResponse.json({
      data: grouped,
      message: "Using fallback locations",
    });
  }
}
