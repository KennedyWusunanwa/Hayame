import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { failJson } from "@/lib/api-errors";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as {
      id?: string;
      first_name?: string;
      last_name?: string;
      full_name?: string;
      city?: string;
      region?: string;
      phone?: string;
      avatar_url?: string | null;
    };

    if (!body.id || body.id !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient() as any;
    const { error } = await admin.from("profiles").upsert(
      {
        id: user.id,
        first_name: body.first_name ?? null,
        last_name: body.last_name ?? null,
        full_name: body.full_name ?? null,
        city: body.city ?? null,
        region: body.region ?? null,
        phone: body.phone ?? null,
        avatar_url: body.avatar_url ?? null,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/profiles/upsert",
      status: 400,
      userMessage: "Couldn't save your profile. Please try again.",
    });
  }
}
