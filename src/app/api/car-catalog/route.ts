import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const { data: makes } = await supa
      .from("car_makes")
      .select("id,name")
      .order("name");
    const { data: models } = await supa
      .from("car_models")
      .select("id,name,make_id")
      .order("name");

    const modelsByMake = new Map<string, { id: string; name: string }[]>();
    (models ?? []).forEach((model: any) => {
      if (!modelsByMake.has(model.make_id)) modelsByMake.set(model.make_id, []);
      modelsByMake.get(model.make_id)!.push({ id: model.id, name: model.name });
    });

    const out = (makes ?? []).map((make: any) => ({
      id: make.id,
      name: make.name,
      models: modelsByMake.get(make.id) ?? [],
    }));

    return NextResponse.json({ makes: out });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Failed to load catalog" },
      { status: 400 },
    );
  }
}
