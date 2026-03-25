import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { buildMessageEmail, sendEmailSafe } from "@/lib/email";
import { sendPushNotificationsToUsers } from "@/lib/push";

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
    const rawLimit = Number(searchParams.get("limit") ?? 200);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 500)) : 200;
    const markRead = ["1", "true", "yes"].includes((searchParams.get("markRead") ?? "").toLowerCase());
    const since = (searchParams.get("since") ?? "").trim();
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

    let query = db
      .from("messages")
      .select("id,conversation_id,sender_id,body,created_at,read_at")
      .eq("conversation_id", conversationId);

    if (since) {
      query = query.gt("created_at", since).order("created_at", { ascending: true });
    } else {
      // Fetch the most recent messages by default, then return in ascending order for UI.
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query.limit(limit);
    if (error) throw error;
    const orderedMessages = since ? data ?? [] : (data ?? []).slice().reverse();

    if (markRead) {
      await db
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .is("read_at", null)
        .neq("sender_id", user.id);
    }

    return NextResponse.json({ data: orderedMessages });
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
    const messageBody = (payload.body ?? "").trim();
    if (!conversationId || !messageBody) {
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
      .insert({ conversation_id: conversationId, sender_id: user.id, body: messageBody })
      .select()
      .single();
    if (error) throw error;

    // Notify recipient via email (best effort)
    const recipientId = user.id === conversation.host_id ? conversation.user_id : conversation.host_id;
    let senderName =
      (user.user_metadata as any)?.full_name ??
      user.email ??
      "User";
    if (adminClient) {
      const [recipientAuthResult, senderProfileResult] = await Promise.all([
        adminClient.auth.admin.getUserById(recipientId).catch(() => null),
        adminClient.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      ]);

      const recipientEmail = extractAuthEmail(recipientAuthResult);
      senderName =
        ((senderProfileResult as any)?.data as { full_name?: string | null } | null)?.full_name ??
        (user.user_metadata as any)?.full_name ??
        user.email ??
        "User";
      const conversationUrl = `${SITE_URL}/messages?conversation=${conversationId}`;
      const carTitle = (conversation as any)?.car?.title ?? null;

      if (recipientEmail) {
        const email = buildMessageEmail({
          senderName,
          messageBody,
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

    try {
      const trimmedPreview = messageBody.trim();
      const preview = trimmedPreview.length > 120 ? `${trimmedPreview.slice(0, 117)}...` : trimmedPreview;
      const pushResult = await sendPushNotificationsToUsers({
        adminClient,
        userIds: [recipientId],
        title: `New message from ${senderName}`,
        body: preview || "You have a new message.",
        collapseId: `message:${conversationId}`,
        data: {
          type: "message",
          conversationId,
          messageId: String(message.id ?? ""),
          senderId: user.id,
        },
      });
      if (pushResult.skipped || pushResult.delivered === 0) {
        console.warn("[messages] push skipped or undelivered", pushResult);
      }
    } catch (pushError) {
      console.error("[messages] push notification failed", pushError);
    }

    return NextResponse.json({ data: message });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "Failed to send message" }, { status: 400 });
  }
}
