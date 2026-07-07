import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { failJson } from "@/lib/api-errors";

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const supa = createSupabaseAdminClient() as any;
  const { data, error } = await supa
    .from("car_makes")
    .select("id,name")
    .order("name");
  if (error)
    return failJson({
      error,
      route: "/api/admin/car-makes",
      status: 400,
      userMessage: "Couldn't load the car makes. Please try again.",
    });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const admin = await requireAdminApi();
  if (!admin)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name)
    return NextResponse.json({ message: "Missing name" }, { status: 400 });
  const supa = createSupabaseAdminClient() as any;
  const { data, error } = await supa
    .from("car_makes")
    .insert({ name })
    .select("id,name")
    .single();
  if (error)
    return failJson({
      error,
      req,
      route: "/api/admin/car-makes",
      status: 400,
      userMessage: "Couldn't add the car make. Please try again.",
    });
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
    .from("car_makes")
    .update({ name })
    .eq("id", body.id)
    .select("id,name")
    .single();
  if (error)
    return failJson({
      error,
      req,
      route: "/api/admin/car-makes",
      status: 400,
      userMessage: "Couldn't update the car make. Please try again.",
    });
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
  const { error } = await supa.from("car_makes").delete().eq("id", body.id);
  if (error)
    return failJson({
      error,
      req,
      route: "/api/admin/car-makes",
      status: 400,
      userMessage: "Couldn't delete the car make. Please try again.",
    });
  return NextResponse.json({ ok: true });
}
