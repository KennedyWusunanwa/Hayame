import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = (await req.json().catch(() => ({}))) as Body;
    const conversationId = payload.conversationId;
    const body = (payload.body ?? "").trim();
    if (!conversationId || !body) {
      return NextResponse.json({ message: "Missing conversation or message body" }, { status: 400 });
    }

    const { data: conversation, error: convoError } = await supa
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

    const { data: message, error } = await supa
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: user.id, body })
      .select()
      .single();
    if (error) throw error;

    // Notify recipient via email (best effort)
    const recipientId = user.id === conversation.host_id ? conversation.user_id : conversation.host_id;
    const admin = (() => {
      try {
        return createSupabaseAdminClient() as any;
      } catch {
        return null;
      }
    })();

    if (admin) {
      const [recipientAuthResult, senderProfileResult] = await Promise.all([
        admin.auth.admin.getUserById(recipientId).catch(() => null),
        admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle().catch(() => null),
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
