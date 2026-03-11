import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { buildMessageEmail, sendEmailSafe } from "@/lib/email";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.EMAIL_BASE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

function extractAuthEmail(result: any): string | null {
  return result?.data?.user?.email ?? result?.user?.email ?? result?.email ?? null;
}

type Body = {
  conversationId?: string;
  body?: string;
};

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
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversationId = (searchParams.get("conversationId") ?? "").trim();
    const limit = Math.min(Number(searchParams.get("limit") ?? 200), 500);
    const markRead = ["1", "true", "yes"].includes((searchParams.get("markRead") ?? "").toLowerCase());
    if (!conversationId) {
      return NextResponse.json({ message: "Missing conversationId" }, { status: 400 });
    }

    const { data: conversation } = await db
      .from("conversations")
      .select("id,host_id,user_id")
      .eq("id", conversationId)
      .maybeSingle();
    if (!conversation) {
      return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
    }
    if (user.id !== conversation.host_id && user.id !== conversation.user_id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await db
      .from("messages")
      .select("id,conversation_id,sender_id,body,created_at,read_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(Number.isFinite(limit) ? limit : 200);
    if (error) throw error;

    if (markRead) {
      await db
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .is("read_at", null)
        .neq("sender_id", user.id);
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to load messages" }, { status: 400 });
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
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = (await req.json().catch(() => ({}))) as Body;
    const conversationId = payload.conversationId;
    const body = (payload.body ?? "").trim();
    if (!conversationId || !body) {
      return NextResponse.json({ message: "Missing conversation or message body" }, { status: 400 });
    }

    const { data: conversation, error: convoError } = await db
      .from("conversations")
      .select("id,host_id,user_id,car_id,car:cars(title)")
      .eq("id", conversationId)
      .single();
    if (convoError || !conversation) {
      return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
    }
    if (user.id !== conversation.host_id && user.id !== conversation.user_id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { data: message, error } = await db
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: user.id, body })
      .select()
      .single();
    if (error) throw error;

    // Notify recipient via email (best effort)
    const recipientId = user.id === conversation.host_id ? conversation.user_id : conversation.host_id;
    if (adminClient) {
      const [recipientAuthResult, senderProfileResult] = await Promise.all([
        adminClient.auth.admin.getUserById(recipientId).catch(() => null),
        adminClient.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      ]);

      const recipientEmail = extractAuthEmail(recipientAuthResult);
      const senderName =
        ((senderProfileResult as any)?.data as { full_name?: string | null } | null)?.full_name ??
        (user.user_metadata as any)?.full_name ??
        user.email ??
        "User";
      const conversationUrl = `${SITE_URL}/messages?conversation=${conversationId}`;
      const carTitle = (conversation as any)?.car?.title ?? null;

      if (recipientEmail) {
        const email = buildMessageEmail({
          senderName,
          messageBody: body,
          conversationUrl,
          carTitle,
        });
        await sendEmailSafe({
          to: recipientEmail,
          ...email,
          idempotencyKey: `message:${message.id}`,
        });
      }
    }

    return NextResponse.json({ data: message });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to send message" }, { status: 400 });
  }
}
