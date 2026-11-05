import { NextResponse } from "next/server";
import { failJson } from "@/lib/api-errors";
import { requireAdminApi } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { carFormSchema } from "@/lib/validators";
import { getHostStatus } from "@/lib/host-status";
import { buildListingTitle } from "@/lib/listing-title";
import {
  buildAdminListingEditedEmail,
  buildAdminListingSubmittedEmail,
  sendAdminNotificationSafe,
} from "@/lib/email";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, context: Params) {
  const { id } = await context.params;
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const user = await getRequestUser(supabase as any, req);
    const admin = await requireAdminApi("vehicles.review");

    // maybeSingle(), not single(): single() raises PGRST116 ("Cannot coerce the
    // result to a single JSON object") when the row is absent, which the catch
    // below then files as an error report. A request for a car that was deleted
    // is a routine 404, not a server fault — it was flooding /admin/errors.
    const { data, error } = await supa
      .from("cars")
      .select(
        "*, car_photos(url), owner:profiles!cars_owner_id_fkey(id,full_name,avatar_url,city,is_host,id_verified,phone_verified,email_verified,host_level)",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ message: "Car not found" }, { status: 404 });
    }
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
    // Genuine faults only now — a missing car returns above without logging.
    return failJson({
      error,
      req,
      route: "/api/cars/[id]",
      status: 500,
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
    const admin = await requireAdminApi("vehicles.review");
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
          reviewed_by: admin.email,
          rejection_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await logAdminAction({
        action: "listing_edited_by_admin",
        summary: `${admin.name} edited the listing ${listingTitle ?? id} and approved it`,
        targetType: "car",
        targetId: id,
        actor: admin,
      });
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
      .select("*")
      .eq("id", id)
      .single();
    const car = carData as (Record<string, unknown> & { owner_id: string }) | null;
    if (!car || car.owner_id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // A listing that is already live keeps its approval: a host can fix a
    // price or a description without the car vanishing from search while it
    // waits in the queue again. Admins are told what changed instead. Pending
    // and rejected listings still go (back) into the review queue.
    const keepsApproval = car.approval_status === "approved";
    const nextValues = {
      ...parsed,
      title: listingTitle,
      air_conditioning: hasAirConditioning,
      delivery_fee: parsed.delivery_available
        ? (parsed.delivery_fee ?? 0)
        : null,
    };
    const changes = describeListingChanges(car, nextValues);

    const { data, error } = await supa
      .from("cars")
      .update({
        ...nextValues,
        ...(keepsApproval
          ? { rejection_reason: null }
          : {
              approval_status: "pending",
              reviewed_at: null,
              reviewed_by: null,
              rejection_reason: null,
            }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    // Tell the office: either "a live listing changed" (activity only) or
    // "this listing is back in the review queue".
    try {
      const { data: profile } = await supa
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const hostName =
        profile?.full_name ??
        (user.user_metadata as any)?.full_name ??
        user.email ??
        null;
      const updatedAt = String(data?.updated_at ?? new Date().toISOString());
      const carTitle = data?.title ?? listingTitle;

      if (keepsApproval) {
        await logAdminAction({
          action: "listing_edited_by_host",
          summary: `${hostName ?? "A host"} edited the live listing ${carTitle}${
            changes.length > 0
              ? ` (${changes.map((change) => change.label.toLowerCase()).join(", ")})`
              : ""
          }`,
          targetType: "car",
          targetId: id,
          metadata: {
            host_id: user.id,
            host_email: user.email ?? null,
            changes: changes.map(
              (change) => `${change.label}: ${change.from} to ${change.to}`,
            ),
          },
          // Not an admin; the host is named in the summary and metadata.
          actor: null,
          // The dedicated email below carries the details.
          silent: true,
        });
        await sendAdminNotificationSafe({
          template: buildAdminListingEditedEmail({
            carId: id,
            carTitle,
            hostName,
            hostEmail: user.email ?? null,
            changes,
            editedAt: updatedAt,
          }),
          idempotencyKey: `listing:${id}:edited:${updatedAt}`,
          replyTo: user.email ?? undefined,
        });
      } else {
        await sendAdminNotificationSafe({
          template: buildAdminListingSubmittedEmail({
            carId: id,
            carTitle,
            hostName,
            hostEmail: user.email ?? null,
            city: data?.city ?? null,
            region: data?.region ?? null,
            dailyPrice:
              data?.daily_price === null || data?.daily_price === undefined
                ? null
                : Number(data.daily_price),
            resubmitted: true,
            submittedAt: updatedAt,
          }),
          idempotencyKey: `listing:${id}:resubmitted:${updatedAt}`,
          replyTo: user.email ?? undefined,
        });
      }
    } catch (notifyError) {
      console.error("[cars] admin listing update notice failed", notifyError);
    }

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
    const admin = await requireAdminApi("vehicles.delete");
    if (admin) {
      const adminClient = createSupabaseAdminClient() as any;
      const { data: doomed } = await adminClient.from("cars").select("title,city").eq("id", id).maybeSingle();
      const { error } = await adminClient.from("cars").delete().eq("id", id);
      if (error) throw error;
      await logAdminAction({
        action: "listing_deleted",
        summary: `${admin.name} deleted the listing ${doomed?.title ?? id}${doomed?.city ? ` (${doomed.city})` : ""}`,
        targetType: "car",
        targetId: id,
        actor: admin,
      });
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

// ---------------------------------------------------------------------------
// Change summary for the admin activity notice when a live listing is edited.
// ---------------------------------------------------------------------------

type ListingChange = { label: string; from: string; to: string };

type TrackedField = {
  key: string;
  label: string;
  kind?: "money" | "bool" | "list" | "text";
};

const TRACKED_LISTING_FIELDS: TrackedField[] = [
  { key: "title", label: "Title" },
  { key: "daily_price", label: "Daily price", kind: "money" },
  { key: "description", label: "Description", kind: "text" },
  { key: "city", label: "City" },
  { key: "region", label: "Region" },
  { key: "car_type", label: "Car type" },
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "car_year", label: "Year" },
  { key: "seats", label: "Seats" },
  { key: "transmission", label: "Transmission" },
  { key: "fuel_type", label: "Fuel" },
  { key: "features", label: "Features", kind: "list" },
  { key: "is_available", label: "Available", kind: "bool" },
  { key: "instant_book", label: "Instant Book", kind: "bool" },
  { key: "delivery_available", label: "Delivery", kind: "bool" },
  { key: "allow_one_day_booking", label: "1-day bookings", kind: "bool" },
  { key: "with_driver", label: "Comes with a driver", kind: "bool" },
  { key: "air_conditioning", label: "Air conditioning", kind: "bool" },
  { key: "delivery_fee", label: "Delivery fee", kind: "money" },
  { key: "insurance_fee", label: "Insurance fee", kind: "money" },
  { key: "deposit_amount", label: "Deposit", kind: "money" },
  { key: "outside_accra_fee", label: "Outside-region fee", kind: "money" },
  { key: "cancellation_policy", label: "Cancellation policy" },
];

function comparable(field: TrackedField, value: unknown): string {
  if (field.kind === "list") {
    return (Array.isArray(value) ? value : [])
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean)
      .sort()
      .join("|");
  }
  if (field.kind === "bool") return String(Boolean(value));
  if (field.kind === "money") return String(Number(value ?? 0) || 0);
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function display(field: TrackedField, value: unknown): string {
  if (field.kind === "list") {
    const items = (Array.isArray(value) ? value : [])
      .map((item) => String(item).trim())
      .filter(Boolean);
    return items.length > 0 ? items.join(", ") : "none";
  }
  if (field.kind === "bool") return value ? "on" : "off";
  if (field.kind === "money") return `GHS ${Number(value ?? 0) || 0}`;
  const text = String(value ?? "").trim();
  if (!text) return "not set";
  if (field.kind === "text" && text.length > 80) return `${text.slice(0, 77)}...`;
  return text;
}

/** Fields whose saved value differs from the stored row, in human terms. */
function describeListingChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): ListingChange[] {
  const changes: ListingChange[] = [];
  for (const field of TRACKED_LISTING_FIELDS) {
    if (!(field.key in after) || after[field.key] === undefined) continue;
    const previous = before[field.key];
    const next = after[field.key];
    if (comparable(field, previous) === comparable(field, next)) continue;
    changes.push({
      label: field.label,
      from: display(field, previous),
      to: display(field, next),
    });
  }
  return changes;
}
