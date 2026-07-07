import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { failJson } from "@/lib/api-errors";

type CarCatalogPayload = {
  makes: Array<{
    id: string;
    name: string;
    models: Array<{ id: string; name: string }>;
  }>;
};

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
};
const SERVER_CACHE_TTL_MS = 10 * 60 * 1000;

let cachedPayload: { expiresAt: number; payload: CarCatalogPayload } | null =
  null;

export async function GET() {
  if (cachedPayload && cachedPayload.expiresAt > Date.now()) {
    return NextResponse.json(cachedPayload.payload, { headers: CACHE_HEADERS });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const [makesResult, modelsResult] = await Promise.all([
      supa.from("car_makes").select("id,name").order("name"),
      supa.from("car_models").select("id,name,make_id").order("name"),
    ]);
    if (makesResult.error) throw makesResult.error;
    if (modelsResult.error) throw modelsResult.error;

    const modelsByMake = new Map<string, { id: string; name: string }[]>();
    (modelsResult.data ?? []).forEach((model: any) => {
      if (!modelsByMake.has(model.make_id)) modelsByMake.set(model.make_id, []);
      modelsByMake.get(model.make_id)!.push({ id: model.id, name: model.name });
    });

    const out = (makesResult.data ?? []).map((make: any) => ({
      id: make.id,
      name: make.name,
      models: modelsByMake.get(make.id) ?? [],
    }));

    const payload = { makes: out };
    cachedPayload = {
      expiresAt: Date.now() + SERVER_CACHE_TTL_MS,
      payload,
    };

    return NextResponse.json(payload, { headers: CACHE_HEADERS });
  } catch (error: any) {
    return failJson({
      error,
      route: "/api/car-catalog",
      status: 400,
      userMessage: "Couldn't load the car catalog. Please try again.",
    });
  }
}
