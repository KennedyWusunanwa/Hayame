import { NextResponse } from "next/server";
import {
  buildSupportAcknowledgementEmail,
  buildSupportRequestEmail,
  sendEmailSafe,
} from "@/lib/email";
import {
  contactRequestSchema,
  isContactSpamTrapTriggered,
} from "@/lib/contact-support";
import { SUPPORT_EMAIL } from "@/lib/support";
import { failJson } from "@/lib/api-errors";

const supportInboxEmail =
  process.env.SUPPORT_INBOX_EMAIL?.trim() || SUPPORT_EMAIL;

function emailWasSkipped(result: unknown) {
  return Boolean(
    result &&
    typeof result === "object" &&
    "skipped" in result &&
    (result as { skipped?: boolean }).skipped === true,
  );
}

function emailHasError(result: unknown) {
  return Boolean(
    result &&
    typeof result === "object" &&
    "error" in result &&
    (result as { error?: unknown }).error,
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = contactRequestSchema.parse(body);

    if (isContactSpamTrapTriggered(parsed)) {
      return NextResponse.json({ sent: true });
    }

    const submittedAt = new Date().toISOString();
    const supportEmail = buildSupportRequestEmail({
      email: parsed.email,
      message: parsed.message,
      name: parsed.name,
      phone: parsed.phone || null,
      submittedAt,
    });

    const acknowledgement = buildSupportAcknowledgementEmail({
      name: parsed.name,
      supportEmail: supportInboxEmail,
    });

    const [supportSendResult, ackResult] = await Promise.allSettled([
      sendEmailSafe({
        to: supportInboxEmail,
        replyTo: parsed.email,
        subject: supportEmail.subject,
        html: supportEmail.html,
        text: supportEmail.text,
        idempotencyKey: `contact:${parsed.email}:${submittedAt}`,
      }),
      sendEmailSafe({
        to: parsed.email,
        subject: acknowledgement.subject,
        html: acknowledgement.html,
        text: acknowledgement.text,
        idempotencyKey: `contact-ack:${parsed.email}:${submittedAt}`,
      }),
    ]);

    const supportFailure =
      supportSendResult.status === "rejected" ||
      (supportSendResult.status === "fulfilled" &&
        (emailWasSkipped(supportSendResult.value) ||
          emailHasError(supportSendResult.value)));
    const acknowledgementFailure =
      ackResult.status === "rejected" ||
      (ackResult.status === "fulfilled" &&
        (emailWasSkipped(ackResult.value) || emailHasError(ackResult.value)));

    if (supportFailure || acknowledgementFailure) {
      return NextResponse.json(
        {
          message:
            "Support email is not configured correctly yet. Please use the direct contact details above.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    return failJson({
      error,
      req,
      route: "/api/contact",
      status: 400,
      userMessage: "Unable to send your message. Please try again.",
    });
  }
}
