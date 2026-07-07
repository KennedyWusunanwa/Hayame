import { NextResponse } from "next/server";
import { failJson } from "@/lib/api-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { favoriteSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();
    const db = admin ?? (supabase as any);
    const user = await getRequestUser(supabase as any, req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data, error } = await db
      .from("favorites")
      .select("car_id")
      .eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/favorites",
      status: 400,
      userMessage: "Couldn't load your favorites. Please try again.",
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { carId, isFavorite } = favoriteSchema.parse(body);
    const supabase = await createSupabaseServerClient();
    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();
    const db = admin ?? (supabase as any);
    const user = await getRequestUser(supabase as any, req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    if (isFavorite) {
      const { error } = await db.from("favorites").upsert({
        car_id: carId,
        user_id: user.id,
      });
      if (error) throw error;
    } else {
      const { error } = await db
        .from("favorites")
        .delete()
        .eq("car_id", carId)
        .eq("user_id", user.id);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/favorites",
      status: 400,
      userMessage: "Couldn't update your favorite. Please try again.",
    });
  }
}
