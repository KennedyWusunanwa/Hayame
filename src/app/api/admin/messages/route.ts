import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ADMIN_OFFICE_AVATAR, ADMIN_OFFICE_NAME, ADMIN_OFFICE_PROFILE_ID } from "@/lib/admin-office";

const COOKIE_NAME = "admin_auth";

function adminToken() {
  const username = process.env.ADMIN_USERNAME ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!username || !password) return null;
  return Buffer.from(`${username}:${password}`).toString("base64");
}

async function requireAdminClient() {
  const token = adminToken();
  if (!token) return null;
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  if (cookie !== token) return null;
  return createSupabaseAdminClient() as any;
}

async function ensureOfficeProfile(admin: any) {
  await admin.from("profiles").upsert(
    {
      id: ADMIN_OFFICE_PROFILE_ID,
      full_name: ADMIN_OFFICE_NAME,
      avatar_url: ADMIN_OFFICE_AVATAR,
      id_verified: true,
      phone_verified: true,
      email_verified: true,
      is_host: false,
    },
    { onConflict: "id" },
  );
}

type RequestBody =
  | { action?: "start"; userId?: string }
  | { action?: "send"; conversationId?: string; body?: string };

type ParticipantSummary = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
};

type ConversationSummary = {
  id: string;
  created_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  participant: ParticipantSummary;
};

export async function GET(req: Request) {
  try {
    const admin = await requireAdminClient();
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    await ensureOfficeProfile(admin);

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope");
    const conversationId = searchParams.get("conversationId");
    const q = (searchParams.get("q") ?? "").trim();

    if (scope === "users") {
      let query = admin
        .from("profiles")
        .select("id,full_name,avatar_url,phone,city,created_at")
        .neq("id", ADMIN_OFFICE_PROFILE_ID)
        .order("created_at", { ascending: false })
        .limit(200);

      if (q) {
        query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,city.ilike.%${q}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ data: data ?? [] });
    }

    if (conversationId) {
      const { data: conversation, error: conversationError } = await admin
        .from("conversations")
        .select(
          "id,host_id,user_id,last_message_at,last_message_preview,created_at,user:profiles!conversations_user_id_fkey(id,full_name,avatar_url,phone,city),host:profiles!conversations_host_id_fkey(id,full_name,avatar_url,phone,city)",
        )
        .eq("id", conversationId)
        .or(`host_id.eq.${ADMIN_OFFICE_PROFILE_ID},user_id.eq.${ADMIN_OFFICE_PROFILE_ID}`)
        .maybeSingle();
      if (conversationError) throw conversationError;
      if (!conversation) {
        return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
      }

      await admin
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .is("read_at", null)
        .neq("sender_id", ADMIN_OFFICE_PROFILE_ID);

      const { data: messages, error: messagesError } = await admin
        .from("messages")
        .select("id,conversation_id,sender_id,body,created_at,read_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(300);
      if (messagesError) throw messagesError;

      const participant =
        conversation.host_id === ADMIN_OFFICE_PROFILE_ID ? conversation.user : conversation.host;

      return NextResponse.json({
        data: {
          conversation: {
            id: conversation.id,
            created_at: conversation.created_at,
            last_message_at: conversation.last_message_at,
            last_message_preview: conversation.last_message_preview,
            participant: {
              id: participant?.id ?? "",
              full_name: participant?.full_name ?? "User",
              avatar_url: participant?.avatar_url ?? null,
              phone: participant?.phone ?? null,
              city: participant?.city ?? null,
            },
          },
          messages: messages ?? [],
        },
      });
    }

    const { data: conversations, error: conversationsError } = await admin
      .from("conversations")
      .select(
        "id,host_id,user_id,last_message_at,last_message_preview,created_at,user:profiles!conversations_user_id_fkey(id,full_name,avatar_url,phone,city),host:profiles!conversations_host_id_fkey(id,full_name,avatar_url,phone,city)",
      )
      .or(`host_id.eq.${ADMIN_OFFICE_PROFILE_ID},user_id.eq.${ADMIN_OFFICE_PROFILE_ID}`);
    if (conversationsError) throw conversationsError;

    const mapped: ConversationSummary[] = (conversations ?? []).map((row: any) => {
      const participant = row.host_id === ADMIN_OFFICE_PROFILE_ID ? row.user : row.host;
      return {
        id: row.id,
        created_at: row.created_at,
        last_message_at: row.last_message_at,
        last_message_preview: row.last_message_preview,
        participant: {
          id: participant?.id ?? "",
          full_name: participant?.full_name ?? "User",
          avatar_url: participant?.avatar_url ?? null,
          phone: participant?.phone ?? null,
          city: participant?.city ?? null,
        },
      };
    });

    const conversationIds = mapped.map((item) => item.id);
    let unreadByConversation: Record<string, number> = {};
    if (conversationIds.length > 0) {
      const { data: unreadRows } = await admin
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", conversationIds)
        .is("read_at", null)
        .neq("sender_id", ADMIN_OFFICE_PROFILE_ID);
      unreadByConversation = (unreadRows ?? []).reduce((acc: Record<string, number>, row: any) => {
        const key = String(row.conversation_id ?? "");
        if (!key) return acc;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});
    }

    mapped.sort((a: ConversationSummary, b: ConversationSummary) => {
      const aTime = a.last_message_at ?? a.created_at ?? "";
      const bTime = b.last_message_at ?? b.created_at ?? "";
      return bTime.localeCompare(aTime);
    });

    return NextResponse.json({
      data: mapped.map((item) => ({
        ...item,
        unread_count: unreadByConversation[item.id] ?? 0,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to fetch admin messages" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdminClient();
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    await ensureOfficeProfile(admin);

    const payload = (await req.json().catch(() => ({}))) as RequestBody;
    const action = payload.action;

    if (action === "start") {
      const userId = String(payload.userId ?? "").trim();
      if (!userId) {
        return NextResponse.json({ message: "Missing user id" }, { status: 400 });
      }
      if (userId === ADMIN_OFFICE_PROFILE_ID) {
        return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
      }

      const { data: target } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
      if (!target) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

      const { data: existing } = await admin
        .from("conversations")
        .select("id")
        .eq("host_id", ADMIN_OFFICE_PROFILE_ID)
        .eq("user_id", userId)
        .is("car_id", null)
        .maybeSingle();
      if (existing?.id) {
        return NextResponse.json({ data: { id: existing.id } });
      }

      const { data, error } = await admin
        .from("conversations")
        .insert({
          host_id: ADMIN_OFFICE_PROFILE_ID,
          user_id: userId,
          car_id: null,
          booking_id: null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (action === "send") {
      const conversationId = String(payload.conversationId ?? "").trim();
      const body = String(payload.body ?? "").trim();
      if (!conversationId || !body) {
        return NextResponse.json({ message: "Missing conversation or message body" }, { status: 400 });
      }

      const { data: conversation } = await admin
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .or(`host_id.eq.${ADMIN_OFFICE_PROFILE_ID},user_id.eq.${ADMIN_OFFICE_PROFILE_ID}`)
        .maybeSingle();
      if (!conversation) {
        return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
      }

      const { data: message, error } = await admin
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: ADMIN_OFFICE_PROFILE_ID,
          body,
        })
        .select("id,conversation_id,sender_id,body,created_at,read_at")
        .single();
      if (error) throw error;

      await admin
        .from("conversations")
        .update({
          last_message_at: message.created_at,
          last_message_preview: body.slice(0, 160),
        })
        .eq("id", conversationId);

      return NextResponse.json({ data: message });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to process admin message" }, { status: 400 });
  }
}
