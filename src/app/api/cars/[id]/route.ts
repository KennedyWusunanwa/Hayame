import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { carFormSchema } from "@/lib/validators";

const COOKIE_NAME = "admin_auth";

function adminToken() {
  const username = process.env.ADMIN_USERNAME ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!username || !password) return null;
  return Buffer.from(`${username}:${password}`).toString("base64");
}

async function isAdmin() {
  const token = adminToken();
  if (!token) return false;
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  return cookie === token;
}

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Params) {
  const { id } = await context.params;
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const { data, error } = await supa
      .from("cars")
      .select("*, car_photos(url)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 404 });
  }
}

export async function PUT(req: Request, context: Params) {
  const { id } = await context.params;
  try {
    const body = await req.json();
    const parsed = carFormSchema.parse(body);
    const admin = await isAdmin();
    if (admin) {
      const adminClient = createSupabaseAdminClient() as any;
      const { data, error } = await adminClient
        .from("cars")
        .update({ ...parsed, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { data: profileData } = await supa
      .from("profiles")
      .select("is_host")
      .eq("id", user.id)
      .maybeSingle();
    const profile = profileData as { is_host?: boolean } | null;
    if (!profile?.is_host) {
      return NextResponse.json({ message: "Host approval required" }, { status: 403 });
    }

    // Ensure profile exists to satisfy FK on related operations
    await supa.from("profiles").upsert(
      {
        id: user.id,
        full_name: (user.user_metadata as any)?.full_name ?? user.email,
      },
      { onConflict: "id" },
    );

    const { data: carData } = await supa.from("cars").select("owner_id").eq("id", id).single();
    const car = carData as { owner_id: string } | null;
    if (!car || car.owner_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supa
      .from("cars")
      .update({ ...parsed, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to update car" }, { status: 400 });
  }
}

export async function DELETE(_: Request, context: Params) {
  const { id } = await context.params;
  try {
    const admin = await isAdmin();
    if (admin) {
      const adminClient = createSupabaseAdminClient() as any;
      const { error } = await adminClient.from("cars").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const { data: profileData } = await supa
      .from("profiles")
      .select("is_host")
      .eq("id", user.id)
      .maybeSingle();
    const profile = profileData as { is_host?: boolean } | null;
    if (!profile?.is_host) {
      return NextResponse.json({ message: "Host approval required" }, { status: 403 });
    }
    const { data: carData } = await supa.from("cars").select("owner_id").eq("id", id).single();
    const car = carData as { owner_id: string } | null;
    if (!car || car.owner_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const { error } = await supa.from("cars").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to delete car" }, { status: 400 });
  }
}
