import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { failJson } from "@/lib/api-errors";
import type { Database } from "@/lib/database.types";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Params) {
  const { id } = await context.params;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("cars")
      .select(
        "*, car_photos(url), owner:profiles!cars_owner_id_fkey(id, full_name, avatar_url, city)",
      )
      .eq("id", id)
      .maybeSingle<
        Database["public"]["Tables"]["cars"]["Row"] & {
          car_photos?: { url: string }[];
          owner?: {
            id?: string;
            full_name?: string | null;
            avatar_url?: string | null;
            city?: string | null;
          } | null;
        }
      >();

    if (error || !data) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return failJson({
      error,
      req: _,
      route: "/api/vehicle-details/[id]",
      status: 500,
      userMessage: "Something went wrong loading the vehicle details. Please try again.",
    });
  }
}
