import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { buildConversationStartedEmail, sendEmailSafe } from "@/lib/email";
import { failJson } from "@/lib/api-errors";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.EMAIL_BASE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

function extractAuthEmail(result: any): string | null {
  return (
    result?.data?.user?.email ?? result?.user?.email ?? result?.email ?? null
  );
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const adminClient = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();
    const db = adminClient ?? (supabase as any);
    const user = await getRequestUser(supabase as any, req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const carId = searchParams.get("carId");

    let query = db
      .from("conversations")
      .select(
        "id,host_id,user_id,car_id,booking_id,last_message_at,last_message_preview,created_at,host:profiles!conversations_host_id_fkey(id,full_name,avatar_url,phone,city),user:profiles!conversations_user_id_fkey(id,full_name,avatar_url,phone,city),car:cars(title,city,region)",
      )
      .or(`host_id.eq.${user.id},user_id.eq.${user.id}`);

    if (carId) {
      query = query.eq("car_id", carId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as any[];
    const conversationIds = rows.map((row) => row.id).filter(Boolean);
    const unreadCountByConversation: Record<string, number> = {};

    if (conversationIds.length > 0) {
      const { data: unreadRows } = await db
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", conversationIds)
        .is("read_at", null)
        .neq("sender_id", user.id);

      for (const row of unreadRows ?? []) {
        const key = String((row as any)?.conversation_id ?? "");
        if (!key) continue;
        unreadCountByConversation[key] =
          (unreadCountByConversation[key] ?? 0) + 1;
      }
    }

    const normalized = rows
      .map((row) => {
        const isHost = row.host_id === user.id;
        const other = isHost ? row.user : row.host;
        const otherId = isHost ? row.user_id : row.host_id;
        const carLocation =
          [row?.car?.city, row?.car?.region].filter(Boolean).join(", ") || null;
        return {
          id: row.id,
          host_id: row.host_id,
          user_id: row.user_id,
          car_id: row.car_id ?? null,
          booking_id: row.booking_id ?? null,
          created_at: row.created_at,
          last_message_at: row.last_message_at ?? null,
          last_message_preview: row.last_message_preview ?? null,
          unread_count: unreadCountByConversation[row.id] ?? 0,
          other_user: {
            id: other?.id ?? otherId,
            name: other?.full_name ?? "User",
            avatar: other?.avatar_url ?? null,
          },
          host_profile: row?.host
            ? {
                id: row.host.id,
                name: row.host.full_name ?? "Host",
                avatar: row.host.avatar_url ?? null,
                phone: row.host.phone ?? null,
                city: row.host.city ?? null,
              }
            : null,
          user_profile: row?.user
            ? {
                id: row.user.id,
                name: row.user.full_name ?? "User",
                avatar: row.user.avatar_url ?? null,
                phone: row.user.phone ?? null,
                city: row.user.city ?? null,
              }
            : null,
          car_title: row?.car?.title ?? null,
          car_location: carLocation,
        };
      })
      .sort((a, b) => {
        const aTime = a.last_message_at ?? a.created_at ?? "";
        const bTime = b.last_message_at ?? b.created_at ?? "";
        return bTime.localeCompare(aTime);
      });

    return NextResponse.json({ data: normalized });
  } catch (error: any) {
    return failJson({
      error,
      req,
      route: "/api/conversations",
      status: 400,
      userMessage: "Couldn't load your conversations. Please try again.",
    });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const adminClient = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();
    const db = adminClient ?? (supabase as any);
    const user = await getRequestUser(supabase as any, req);
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as {
      hostId?: string;
      participantId?: string | null;
      carId?: string | null;
    };
    const hostId = body.hostId;
    const participantId = body.participantId ?? null;
    const carId = body.carId ?? null;
    let resolvedHostId: string | null = null;
    let resolvedUserId: string | null = null;

    if (hostId && !participantId) {
      if (hostId === user.id) {
        return NextResponse.json(
          { message: "Cannot message yourself" },
          { status: 400 },
        );
      }
      resolvedHostId = hostId;
      resolvedUserId = user.id;
    } else if (hostId && participantId) {
      if (!carId) {
        return NextResponse.json(
          { message: "Missing carId for participant chat" },
          { status: 400 },
        );
      }
      if (hostId !== user.id) {
        return NextResponse.json(
          { message: "Only host can start this chat path" },
          { status: 403 },
        );
      }
      resolvedHostId = hostId;
      resolvedUserId = participantId;
    } else if (!hostId && participantId && carId) {
      const { data: car } = await db
        .from("cars")
        .select("owner_id")
        .eq("id", carId)
        .maybeSingle();
      if (!car?.owner_id)
        return NextResponse.json({ message: "Car not found" }, { status: 404 });
      resolvedHostId = car.owner_id;
      resolvedUserId = user.id === car.owner_id ? participantId : user.id;
    } else {
      return NextResponse.json(
        { message: "Missing hostId or participantId" },
        { status: 400 },
      );
    }

    if (!resolvedHostId || !resolvedUserId) {
      return NextResponse.json(
        { message: "Unable to resolve conversation participants" },
        { status: 400 },
      );
    }
    if (resolvedHostId === resolvedUserId) {
      return NextResponse.json(
        { message: "Cannot message yourself" },
        { status: 400 },
      );
    }

    if (carId && participantId) {
      const { data: bookingExists } = await db
        .from("bookings")
        .select("id")
        .eq("car_id", carId)
        .eq("renter_id", resolvedUserId)
        .limit(1)
        .maybeSingle();
      if (!bookingExists) {
        return NextResponse.json(
          { message: "No booking found for this chat." },
          { status: 403 },
        );
      }
    }

    let existingQuery = db
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

    const { data, error } = await db
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
    if (adminClient) {
      const recipientId =
        user.id === resolvedHostId ? resolvedUserId : resolvedHostId;
      const [recipientAuthResult, senderProfileResult, carResult] =
        await Promise.all([
          adminClient.auth.admin.getUserById(recipientId).catch(() => null),
          adminClient
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle(),
          carId
            ? db.from("cars").select("title").eq("id", carId).maybeSingle()
            : Promise.resolve({ data: null }),
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
    return failJson({
      error,
      req,
      route: "/api/conversations",
      status: 400,
      userMessage: "Couldn't start the conversation. Please try again.",
    });
  }
}
