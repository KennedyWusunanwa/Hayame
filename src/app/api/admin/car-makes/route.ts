import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const COOKIE_NAME = "admin_auth";

function adminToken() {
  const username = process.env.ADMIN_USERNAME ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!username || !password) return null;
  return Buffer.from(`${username}:${password}`).toString("base64");
}

async function requireAdmin() {
  const token = adminToken();
  if (!token) return false;
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  return cookie === token;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const supa = createSupabaseAdminClient() as any;
  const { data, error } = await supa.from("car_makes").select("id,name").order("name");
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { name?: string };
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ message: "Missing name" }, { status: 400 });
  const supa = createSupabaseAdminClient() as any;
  const { data, error } = await supa
    .from("car_makes")
    .insert({ name })
    .select("id,name")
    .single();
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { id?: string; name?: string };
  if (!body.id) return NextResponse.json({ message: "Missing id" }, { status: 400 });
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ message: "Missing name" }, { status: 400 });
  const supa = createSupabaseAdminClient() as any;
  const { data, error } = await supa
    .from("car_makes")
    .update({ name })
    .eq("id", body.id)
    .select("id,name")
    .single();
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ message: "Missing id" }, { status: 400 });
  const supa = createSupabaseAdminClient() as any;
  const { error } = await supa.from("car_makes").delete().eq("id", body.id);
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
