import { NextResponse } from "next/server";
import { failJson } from "@/lib/api-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import {
  buildAdminRenterVerificationEmail,
  buildRenterVerificationSubmittedEmail,
  sendAdminNotificationSafe,
  sendEmailSafe,
} from "@/lib/email";
import {
  RENTER_VERIFICATION_TABLE,
  getRenterVerificationState,
  isMissingRenterVerificationTable,
  renterVerificationBucket,
  renterVerificationDto,
} from "@/lib/renter-verification";

export const dynamic = "force-dynamic";

function adminClientOrNull() {
  try {
    return createSupabaseAdminClient() as any;
  } catch {
    return null;
  }
}

/** Where the signed-in renter stands: unverified, pending, approved or rejected. */
export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const db = adminClientOrNull() ?? (supabase as any);
    const state = await getRenterVerificationState(db, user.id);
    return NextResponse.json({ data: renterVerificationDto(state) });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/renter-verification",
      status: 400,
      userMessage: "Couldn't load your verification. Please try again.",
    });
  }
}

const PATH_FIELDS = [
  ["face_path", "face photo"],
  ["licence_front_path", "front of your driving licence"],
  ["licence_back_path", "back of your driving licence"],
] as const;

/**
 * A storage path is only accepted when it sits in the caller's own folder of
 * the private ID bucket, so nobody can attach another person's documents.
 */
function cleanOwnPath(raw: unknown, userId: string): string | null {
  if (typeof raw !== "string") return null;
  const path = raw.trim().replace(/^\/+/, "");
  if (!path || path.length > 300) return null;
  if (path.includes("..") || path.includes("\\") || path.includes("//"))
    return null;
  if (!path.startsWith(`${userId}/`)) return null;
  if (path.length <= userId.length + 1) return null;
  return path;
}

/** Submit (or resubmit after a rejection) the three photos for review. */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const admin = adminClientOrNull();
    if (!admin) {
      return NextResponse.json(
        { message: "Verification isn't available right now. Please try again shortly." },
        { status: 503 },
      );
    }

    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const paths: Record<string, string> = {};
    for (const [field, label] of PATH_FIELDS) {
      const cleaned = cleanOwnPath(body?.[field], user.id);
      if (!cleaned) {
        return NextResponse.json(
          { message: `Please add the ${label} and try again.` },
          { status: 400 },
        );
      }
      paths[field] = cleaned;
    }
    if (new Set(Object.values(paths)).size !== PATH_FIELDS.length) {
      return NextResponse.json(
        { message: "Please use a different photo for each of the three steps." },
        { status: 400 },
      );
    }

    const current = await getRenterVerificationState(admin, user.id);
    if (!current.available) {
      return NextResponse.json(
        { message: "Verification isn't available right now. Please try again shortly." },
        { status: 503 },
      );
    }
    if (current.status === "approved") {
      return NextResponse.json({ data: renterVerificationDto(current) });
    }
    if (current.status === "pending") {
      return NextResponse.json(
        {
          message:
            "Your photos are already being reviewed. We will email you as soon as it's done.",
          data: renterVerificationDto(current),
        },
        { status: 409 },
      );
    }

    // Make sure each upload actually finished before queueing a review of it.
    const bucket = renterVerificationBucket();
    for (const [field, label] of PATH_FIELDS) {
      const { error: signError } = await admin.storage
        .from(bucket)
        .createSignedUrl(paths[field], 60);
      if (signError) {
        return NextResponse.json(
          {
            message: `The ${label} didn't finish uploading. Please add it again.`,
          },
          { status: 400 },
        );
      }
    }

    const meta = (user.user_metadata ?? {}) as Record<string, any>;
    // The renter_id foreign key needs a profile row; create one if the account
    // predates profiles, but never overwrite what is already there.
    await admin.from("profiles").upsert(
      { id: user.id, full_name: meta.full_name ?? user.email ?? null },
      { onConflict: "id", ignoreDuplicates: true },
    );

    const submittedAt = new Date().toISOString();
    const { data: inserted, error: insertError } = await admin
      .from(RENTER_VERIFICATION_TABLE)
      .insert({
        user_id: user.id,
        status: "pending",
        face_path: paths.face_path,
        licence_front_path: paths.licence_front_path,
        licence_back_path: paths.licence_back_path,
        submitted_at: submittedAt,
      })
      .select("id")
      .single();

    if (insertError) {
      if (isMissingRenterVerificationTable(insertError)) {
        return NextResponse.json(
          { message: "Verification isn't available right now. Please try again shortly." },
          { status: 503 },
        );
      }
      // Unique index on one pending row per renter: a double submit landed.
      if (String((insertError as any).code) === "23505") {
        const again = await getRenterVerificationState(admin, user.id);
        return NextResponse.json({ data: renterVerificationDto(again) });
      }
      throw insertError;
    }

    const verificationId = String(inserted.id);
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name,phone,city")
      .eq("id", user.id)
      .maybeSingle();
    const renterName =
      (profile as any)?.full_name ?? meta.full_name ?? user.email ?? "A renter";

    await Promise.allSettled([
      user.email
        ? sendEmailSafe({
            to: user.email,
            ...buildRenterVerificationSubmittedEmail({ renterName }),
            idempotencyKey: `renter-verification:${verificationId}:submitted`,
          })
        : Promise.resolve(null),
      // Tell the office a renter is waiting to be approved.
      sendAdminNotificationSafe({
        template: buildAdminRenterVerificationEmail({
          verificationId,
          userId: user.id,
          renterName,
          renterEmail: user.email ?? null,
          phone: (profile as any)?.phone ?? null,
          city: (profile as any)?.city ?? null,
          resubmission: current.status === "rejected",
          submittedAt,
        }),
        idempotencyKey: `renter-verification:${verificationId}:admin-notice`,
        replyTo: user.email ?? undefined,
      }),
    ]);

    const state = await getRenterVerificationState(admin, user.id);
    return NextResponse.json({ data: renterVerificationDto(state) });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/renter-verification",
      status: 400,
      userMessage: "Couldn't submit your verification. Please try again.",
    });
  }
}
