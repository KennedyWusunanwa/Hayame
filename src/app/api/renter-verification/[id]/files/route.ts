import { NextResponse } from "next/server";
import { failJson } from "@/lib/api-errors";
import { requireAdminApi } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/request-auth";
import {
  RENTER_VERIFICATION_TABLE,
  renterVerificationBucket,
} from "@/lib/renter-verification";

const FILE_COLUMNS = {
  face: "face_path",
  front: "licence_front_path",
  back: "licence_back_path",
} as const;

const FILE_LABELS = {
  face: "face photo",
  front: "licence front",
  back: "licence back",
} as const;

/**
 * Short-lived link to one verification photo. Only a reviewing admin or the
 * renter who uploaded it may open it; admin views are written to the audit log.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: verificationId } = await context.params;
    const type = new URL(req.url).searchParams.get("type") as
      | keyof typeof FILE_COLUMNS
      | null;
    if (!type || !(type in FILE_COLUMNS)) {
      return NextResponse.json({ message: "Missing type" }, { status: 400 });
    }

    const admin = await requireAdminApi("applications.review");
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!admin && !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createSupabaseAdminClient() as any;
    const { data: verification } = await adminClient
      .from(RENTER_VERIFICATION_TABLE)
      .select("user_id,face_path,licence_front_path,licence_back_path")
      .eq("id", verificationId)
      .maybeSingle();
    if (!verification) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (!admin && verification.user_id !== user?.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const path = verification[FILE_COLUMNS[type]];
    if (!path) {
      return NextResponse.json({ message: "No file" }, { status: 404 });
    }

    const { data, error } = await adminClient.storage
      .from(renterVerificationBucket())
      .createSignedUrl(path, 60 * 10);
    if (error) throw error;

    if (admin && verification.user_id !== user?.id) {
      await logAdminAction({
        action: "renter_id_viewed",
        summary: `${admin.name} opened the ${FILE_LABELS[type]} on renter verification ${verificationId.slice(0, 8).toUpperCase()}`,
        targetType: "renter_verification",
        targetId: verificationId,
        actor: admin,
      });
    }
    return NextResponse.redirect(data.signedUrl);
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/renter-verification/[id]/files",
      status: 400,
      userMessage: "Couldn't load the file. Please try again.",
    });
  }
}
