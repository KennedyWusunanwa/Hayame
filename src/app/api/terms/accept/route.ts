import { NextResponse } from "next/server";
import { failJson } from "@/lib/api-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { TERMS_VERSION, readTermsAcceptance } from "@/lib/terms";

export const dynamic = "force-dynamic";

const PLATFORMS = ["ios", "android", "web"];

/** Records that the signed-in user accepted the current Terms of Service. */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as {
      version?: unknown;
      platform?: unknown;
    } | null;
    const version = typeof body?.version === "string" ? body.version.trim() : "";
    // The client says which text it showed. If that is not the current text,
    // the person has not seen what they would be agreeing to.
    if (version !== TERMS_VERSION) {
      return NextResponse.json(
        {
          message:
            "Our terms were just updated. Please read the new version and accept again.",
          code: "terms_outdated",
        },
        { status: 409 },
      );
    }

    const existing = readTermsAcceptance(user);
    if (existing.accepted) {
      return NextResponse.json({
        data: {
          accepted: true,
          version: TERMS_VERSION,
          acceptedAt: existing.acceptedAt,
        },
      });
    }

    const platform =
      typeof body?.platform === "string" &&
      PLATFORMS.includes(body.platform.trim().toLowerCase())
        ? body.platform.trim().toLowerCase()
        : "unknown";
    const acceptedAt = new Date().toISOString();

    // app_metadata is writable only with the service role, so acceptance
    // cannot be forged from a client.
    const admin = createSupabaseAdminClient() as any;
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata ?? {}),
        terms_version: TERMS_VERSION,
        terms_accepted_at: acceptedAt,
        terms_platform: platform,
      },
    });
    if (error) throw error;

    return NextResponse.json({
      data: { accepted: true, version: TERMS_VERSION, acceptedAt },
    });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/terms/accept",
      status: 400,
      userMessage: "Couldn't save your acceptance. Please try again.",
    });
  }
}
