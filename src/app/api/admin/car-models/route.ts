import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const admin = await requireAdminApi();
  if (!admin)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const makeId = searchParams.get("makeId");
  const supa = createSupabaseAdminClient() as any;
  let query = supa.from("car_models").select("id,name,make_id").order("name");
  if (makeId) query = query.eq("make_id", makeId);
  const { data, error } = await query;
  if (error)
    return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const admin = await requireAdminApi();
  if (!admin)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { name?: string; makeId?: string };
  const name = (body.name ?? "").trim();
  if (!name || !body.makeId) {
    return NextResponse.json(
      { message: "Missing make or name" },
      { status: 400 },
    );
  }
  const supa = createSupabaseAdminClient() as any;
  const { data, error } = await supa
    .from("car_models")
    .insert({ name, make_id: body.makeId })
    .select("id,name,make_id")
    .single();
  if (error)
    return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const admin = await requireAdminApi();
  if (!admin)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { id?: string; name?: string };
  if (!body.id)
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  const name = (body.name ?? "").trim();
  if (!name)
    return NextResponse.json({ message: "Missing name" }, { status: 400 });
  const supa = createSupabaseAdminClient() as any;
  const { data, error } = await supa
    .from("car_models")
    .update({ name })
    .eq("id", body.id)
    .select("id,name,make_id")
    .single();
  if (error)
    return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const admin = await requireAdminApi();
  if (!admin)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { id?: string };
  if (!body.id)
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  const supa = createSupabaseAdminClient() as any;
  const { error } = await supa.from("car_models").delete().eq("id", body.id);
  if (error)
    return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
