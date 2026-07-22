import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

config({ path: ".env.local" });
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding Ghana locations.",
  );
}

function loadCatalog() {
  const source = readFileSync("src/lib/ghana-locations.ts", "utf8");
  const districtsMatch = source.match(
    /export const ghanaDistrictsByRegion = ([\s\S]*?) as const;/,
  );
  const capitalsMatch = source.match(
    /export const ghanaDistrictCapitals = ([\s\S]*?) as const;/,
  );
  if (!districtsMatch || !capitalsMatch) {
    throw new Error("Could not read Ghana location catalog.");
  }
  const districts = Function(
    `"use strict"; return (${districtsMatch[1]});`,
  )();
  const capitals = Function(`"use strict"; return (${capitalsMatch[1]});`)();
  const regionCount = Object.keys(districts).length;
  const districtCount = Object.values(districts).reduce(
    (sum, cities) => sum + cities.length,
    0,
  );
  const capitalCount = Object.keys(capitals).length;
  if (regionCount !== 16 || districtCount !== 261 || capitalCount !== 261) {
    throw new Error(
      `Expected 16 regions, 261 districts, and 261 capitals; got ${regionCount}/${districtCount}/${capitalCount}.`,
    );
  }
  return { districts, capitals };
}

const {
  districts: ghanaDistrictsByRegion,
  capitals: ghanaDistrictCapitals,
} = loadCatalog();
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const locationMetadata = {
  Ledzokuku: { capital: "Teshie", category: "Municipal" },
  "Ningo-Prampram": { capital: "Prampram", category: "Municipal" },
  "North East Gonja": { capital: "Kpalbe", category: "District" },
  "Bolgatanga East": { capital: "Zuarungu", category: "District" },
  Garu: { capital: "Garu", category: "District" },
  Tempane: { capital: "Tempane", category: "District" },
  Anloga: { capital: "Anloga", category: "Municipal" },
  "North Dayi": { capital: "Anfoega", category: "District" },
  Suaman: { capital: "Dadieso", category: "District" },
};

async function seedGhanaLocations() {
  const regionRows = Object.keys(ghanaDistrictsByRegion).map((name, index) => ({
    id: index + 1,
    name,
  }));

  const { error: regionError } = await supabase
    .from("gh_regions")
    .upsert(regionRows, { onConflict: "id" });
  if (regionError) throw regionError;

  const { data: regions, error: regionsLoadError } = await supabase
    .from("gh_regions")
    .select("id,name");
  if (regionsLoadError) throw regionsLoadError;

  const regionIdsByName = new Map(
    regions.map((region) => [region.name, region.id]),
  );

  const desiredDistricts = Object.entries(ghanaDistrictsByRegion).flatMap(
    ([region, districts]) => {
      const regionId = regionIdsByName.get(region);
      if (!regionId) throw new Error(`Missing seeded region: ${region}`);
      return districts.map((name) => {
        const metadata = locationMetadata[name] ?? {};
        return {
          region_id: regionId,
          name,
          capital: ghanaDistrictCapitals[name] ?? metadata.capital ?? name,
          category: metadata.category ?? "District",
        };
      });
    },
  );
  const desiredKeys = new Set(
    desiredDistricts.map(
      (district) => `${district.region_id}\u0000${district.name}`,
    ),
  );

  const { data: existingDistricts, error: districtsLoadError } = await supabase
    .from("gh_districts")
    .select("id,region_id,name");
  if (districtsLoadError) throw districtsLoadError;

  const existingByKey = new Map();
  for (const district of existingDistricts) {
    const key = `${district.region_id}\u0000${district.name}`;
    const rows = existingByKey.get(key) ?? [];
    rows.push(district);
    existingByKey.set(key, rows);
  }

  const inserts = desiredDistricts.filter(
    (district) =>
      !existingByKey.has(`${district.region_id}\u0000${district.name}`),
  );
  if (inserts.length > 0) {
    const { error: insertError } = await supabase
      .from("gh_districts")
      .insert(inserts);
    if (insertError) throw insertError;
  }

  const canonicalRegionIds = new Set(regionIdsByName.values());
  const deleteIds = new Set();
  for (const rows of existingByKey.values()) {
    const [first, ...duplicates] = rows;
    if (!first) continue;
    const key = `${first.region_id}\u0000${first.name}`;
    if (!desiredKeys.has(key) && canonicalRegionIds.has(first.region_id)) {
      rows.forEach((row) => deleteIds.add(row.id));
      continue;
    }
    duplicates.forEach((row) => deleteIds.add(row.id));
  }

  if (deleteIds.size > 0) {
    const { error: deleteError } = await supabase
      .from("gh_districts")
      .delete()
      .in("id", [...deleteIds]);
    if (deleteError) throw deleteError;
  }

  const { count: regionCount, error: finalRegionError } = await supabase
    .from("gh_regions")
    .select("*", { count: "exact", head: true });
  if (finalRegionError) throw finalRegionError;

  const { count: districtCount, error: finalDistrictError } = await supabase
    .from("gh_districts")
    .select("*", { count: "exact", head: true });
  if (finalDistrictError) throw finalDistrictError;

  console.log(
    `Seeded Ghana locations: ${regionCount ?? 0} regions, ${
      districtCount ?? 0
    } districts (${inserts.length} inserted, ${deleteIds.size} removed).`,
  );
}

seedGhanaLocations().catch((error) => {
  console.error(error);
  process.exit(1);
});
