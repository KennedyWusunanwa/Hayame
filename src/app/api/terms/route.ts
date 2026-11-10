import { NextResponse } from "next/server";
import { failJson } from "@/lib/api-errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestUser } from "@/lib/supabase/request-auth";
import {
  isTermsAcceptanceRequired,
  readTermsAcceptance,
  termsDocument,
} from "@/lib/terms";

export const dynamic = "force-dynamic";

/**
 * The current Terms of Service, plus whether the caller (when signed in) has
 * accepted this version. Public: the text is also readable signed out.
 */
export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getRequestUser(supabase as any, req).catch(() => null);
    const acceptance = user ? readTermsAcceptance(user) : null;
    return NextResponse.json({
      data: {
        ...termsDocument(),
        required: isTermsAcceptanceRequired(),
        accepted: acceptance ? acceptance.accepted : null,
        acceptedAt: acceptance?.accepted ? acceptance.acceptedAt : null,
      },
    });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/terms",
      status: 400,
      userMessage: "Couldn't load the terms. Please try again.",
    });
  }
}
