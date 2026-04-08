import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/request-auth";

export async function GET(
  req: Request,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await context.params;
    const appId = resolvedParams.id;
    const type = new URL(req.url).searchParams.get("type");
    if (!type || !["front", "back"].includes(type)) {
      return NextResponse.json({ message: "Missing type" }, { status: 400 });
    }

    const admin = await requireAdminApi();
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);

    if (!admin && !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createSupabaseAdminClient();
    const { data: application } = await (adminClient as any)
      .from("host_applications")
      .select("user_id,id_front_path,id_back_path")
      .eq("id", appId)
      .single();

    if (!application) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    if (!admin && application.user_id !== user?.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const path =
      type === "front" ? application.id_front_path : application.id_back_path;
    if (!path) {
      return NextResponse.json({ message: "No file" }, { status: 404 });
    }

    const bucket =
      process.env.NEXT_PUBLIC_SUPABASE_HOST_ID_BUCKET || "host-ids";
    const { data, error } = await adminClient.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 10);
    if (error) throw error;
    return NextResponse.redirect(data.signedUrl);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Failed to load file" },
      { status: 400 },
    );
  }
}
