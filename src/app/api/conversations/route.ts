import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildConversationStartedEmail, sendEmailSafe } from "@/lib/email";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.EMAIL_BASE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

function extractAuthEmail(result: any): string | null {
  return result?.data?.user?.email ?? result?.user?.email ?? result?.email ?? null;
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { hostId?: string; participantId?: string | null; carId?: string | null };
    const hostId = body.hostId;
    const participantId = body.participantId ?? null;
    const carId = body.carId ?? null;
    const supa = supabase as any;
    let resolvedHostId: string | null = null;
    let resolvedUserId: string | null = null;

    if (hostId && !participantId) {
      if (hostId === user.id) {
        return NextResponse.json({ message: "Cannot message yourself" }, { status: 400 });
      }
      resolvedHostId = hostId;
      resolvedUserId = user.id;
    } else if (hostId && participantId) {
      if (!carId) {
        return NextResponse.json({ message: "Missing carId for participant chat" }, { status: 400 });
      }
      if (hostId !== user.id) {
        return NextResponse.json({ message: "Only host can start this chat path" }, { status: 403 });
      }
      resolvedHostId = hostId;
      resolvedUserId = participantId;
    } else if (!hostId && participantId && carId) {
      const { data: car } = await supa.from("cars").select("owner_id").eq("id", carId).maybeSingle();
      if (!car?.owner_id) return NextResponse.json({ message: "Car not found" }, { status: 404 });
      resolvedHostId = car.owner_id;
      resolvedUserId = user.id === car.owner_id ? participantId : user.id;
    } else {
      return NextResponse.json({ message: "Missing hostId or participantId" }, { status: 400 });
    }

    if (!resolvedHostId || !resolvedUserId) {
      return NextResponse.json({ message: "Unable to resolve conversation participants" }, { status: 400 });
    }
    if (resolvedHostId === resolvedUserId) {
      return NextResponse.json({ message: "Cannot message yourself" }, { status: 400 });
    }

    if (carId && participantId) {
      const { data: bookingExists } = await supa
        .from("bookings")
        .select("id")
        .eq("car_id", carId)
        .eq("renter_id", resolvedUserId)
        .limit(1)
        .maybeSingle();
      if (!bookingExists) {
        return NextResponse.json({ message: "No booking found for this chat." }, { status: 403 });
      }
    }

    let existingQuery = supa
      .from("conversations")
      .select("id")
      .eq("host_id", resolvedHostId)
      .eq("user_id", resolvedUserId);
    if (carId) {
      existingQuery = existingQuery.eq("car_id", carId);
    } else {
      existingQuery = existingQuery.is("car_id", null);
    }
    const { data: existing } = await existingQuery.maybeSingle();
    const existingRow = existing as { id?: string } | null;

    if (existingRow?.id) {
      return NextResponse.json({ id: existingRow.id });
    }

    const { data, error } = await supa
      .from("conversations")
      .insert({
        host_id: resolvedHostId,
        user_id: resolvedUserId,
        car_id: carId,
      })
      .select("id")
      .single();
    if (error) throw error;

    // Notify the recipient that a new conversation started (best effort)
    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();

    if (admin) {
      const recipientId = user.id === resolvedHostId ? resolvedUserId : resolvedHostId;
      const [recipientAuthResult, senderProfileResult, carResult] = await Promise.all([
        admin.auth.admin.getUserById(recipientId).catch(() => null),
        admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        carId ? supa.from("cars").select("title").eq("id", carId).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      const recipientEmail = extractAuthEmail(recipientAuthResult);
      const senderName =
        (senderProfileResult as any)?.data?.full_name ??
        (user.user_metadata as any)?.full_name ??
        user.email ??
        "User";
      const carTitle = (carResult as any)?.data?.title ?? null;

      if (recipientEmail) {
        const conversationUrl = `${SITE_URL}/messages?conversation=${data.id}`;
        const email = buildConversationStartedEmail({
          starterName: senderName,
          conversationUrl,
          carTitle,
        });
        await sendEmailSafe({
          to: recipientEmail,
          ...email,
          idempotencyKey: `conversation:${data.id}:started`,
        });
      }
    }

    return NextResponse.json({ id: data.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to create conversation" }, { status: 400 });
  }
}
