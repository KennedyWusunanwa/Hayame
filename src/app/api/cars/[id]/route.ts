import { NextResponse } from "next/server";
import { failJson } from "@/lib/api-errors";
import { getAdminReviewerName, requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { carFormSchema } from "@/lib/validators";
import { getHostStatus } from "@/lib/host-status";
import { buildListingTitle } from "@/lib/listing-title";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, context: Params) {
  const { id } = await context.params;
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const user = await getRequestUser(supabase as any, req);
    const admin = await requireAdminApi();

    const { data, error } = await supa
      .from("cars")
      .select(
        "*, car_photos(url), owner:profiles!cars_owner_id_fkey(id,full_name,avatar_url,city,is_host,id_verified,phone_verified,email_verified,host_level)",
      )
      .eq("id", id)
      .single();
    if (error) throw error;
    const isOwner = Boolean(user?.id && data.owner_id === user.id);
    if (
      !admin &&
      !isOwner &&
      data.approval_status &&
      data.approval_status !== "approved"
    ) {
      return NextResponse.json({ message: "Car not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/cars/[id]",
      status: 404,
      userMessage: "Couldn't load this car. Please try again.",
    });
  }
}

export async function PUT(req: Request, context: Params) {
  const { id } = await context.params;
  try {
    const body = await req.json();
    const parsed = carFormSchema.parse(body);
    const listingTitle = buildListingTitle(
      parsed.brand,
      parsed.model,
      parsed.car_year,
    );
    if (!listingTitle) {
      return NextResponse.json(
        {
          message:
            "Brand, model and year are required to generate the listing title.",
        },
        { status: 400 },
      );
    }
    const admin = await requireAdminApi();
    const hasAirConditioning =
      Boolean(parsed.air_conditioning) ||
      Boolean(
        parsed.features?.some(
          (feature) => feature.toLowerCase() === "air conditioning",
        ),
      );

    if (admin) {
      const adminClient = createSupabaseAdminClient() as any;
      const { data, error } = await adminClient
        .from("cars")
        .update({
          ...parsed,
          title: listingTitle,
          air_conditioning: hasAirConditioning,
          delivery_fee: parsed.delivery_available
            ? (parsed.delivery_fee ?? 0)
            : null,
          approval_status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: getAdminReviewerName(),
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const user = await getRequestUser(supabase as any, req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { isHost } = await getHostStatus(supa, user.id);
    if (!isHost) {
      return NextResponse.json(
        { message: "Host approval required" },
        { status: 403 },
      );
    }

    // Ensure profile exists to satisfy FK on related operations. `is_host` is
    // NOT set here — it is owned by the host-application approval flow and is
    // protected by a DB trigger (db/launch_security_hardening.sql).
    await supa.from("profiles").upsert(
      {
        id: user.id,
        full_name: (user.user_metadata as any)?.full_name ?? user.email,
      },
      { onConflict: "id" },
    );

    const { data: carData } = await supa
      .from("cars")
      .select("owner_id")
      .eq("id", id)
      .single();
    const car = carData as { owner_id: string } | null;
    if (!car || car.owner_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supa
      .from("cars")
      .update({
        ...parsed,
        title: listingTitle,
        air_conditioning: hasAirConditioning,
        delivery_fee: parsed.delivery_available
          ? (parsed.delivery_fee ?? 0)
          : null,
        approval_status: "pending",
        reviewed_at: null,
        reviewed_by: null,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/cars/[id]",
      status: 400,
      userMessage: "Couldn't update the car. Please try again.",
    });
  }
}

export async function DELETE(req: Request, context: Params) {
  const { id } = await context.params;
  try {
    const admin = await requireAdminApi();
    if (admin) {
      const adminClient = createSupabaseAdminClient() as any;
      const { error } = await adminClient.from("cars").delete().eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const user = await getRequestUser(supabase as any, req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const { isHost } = await getHostStatus(supa, user.id);
    if (!isHost) {
      return NextResponse.json(
        { message: "Host approval required" },
        { status: 403 },
      );
    }
    const { data: carData } = await supa
      .from("cars")
      .select("owner_id")
      .eq("id", id)
      .single();
    const car = carData as { owner_id: string } | null;
    if (!car || car.owner_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const { error } = await supa.from("cars").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/cars/[id]",
      status: 400,
      userMessage: "Couldn't delete the car. Please try again.",
    });
  }
}
