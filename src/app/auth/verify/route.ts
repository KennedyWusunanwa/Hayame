import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Redeems the verification token from a Hayame verification email.
 *
 * This lives on our own domain rather than pointing straight at Supabase's
 * `/auth/v1/verify`, because Supabase rewrites `redirect_to` to the project's
 * Site URL whenever the target isn't in its dashboard allow-list — which used
 * to strand verified users on `http://localhost:3000`. Redeeming the token
 * ourselves removes that dependency entirely.
 *
 * A route handler (not a page) so it can write the session cookie: verifying
 * also signs the user in on web, which is the least surprising outcome after
 * clicking "Verify my email".
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") ?? "signup";

  const resultUrl = (status: string) =>
    new URL(`/auth/verified?status=${status}`, url.origin);

  if (!tokenHash) {
    return NextResponse.redirect(resultUrl("invalid"));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type === "recovery" ? "recovery" : "signup",
      token_hash: tokenHash,
    });

    if (error) {
      // Expired and already-used tokens are the common case and are not worth
      // an error report — the page tells the user how to get a fresh link.
      const message = (error.message || "").toLowerCase();
      const expired =
        message.includes("expired") ||
        message.includes("invalid") ||
        message.includes("not found");
      return NextResponse.redirect(resultUrl(expired ? "expired" : "invalid"));
    }

    return NextResponse.redirect(resultUrl("ok"));
  } catch {
    return NextResponse.redirect(resultUrl("invalid"));
  }
}
