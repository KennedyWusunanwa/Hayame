import "server-only";
import { Resend } from "resend";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  idempotencyKey?: string;
};

const appName = process.env.APP_NAME ?? "Hayame";
const siteUrl =
  process.env.EMAIL_BASE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://hayame.vercel.app");

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function withOfficialFooter(html: string, text: string) {
  const footerHtml = `
      <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e5e7eb;" />
      <p style="color:#6b7280; font-size: 12px;">This is an official notification from ${appName}.</p>
      <p><a href="${siteUrl}" style="color:#2563eb;">Visit ${appName}</a></p>
  `;
  const footerText = `\n\nThis is an official notification from ${appName}.\nVisit ${siteUrl}\n`;
  const closing = "</div>";
  const idx = html.lastIndexOf(closing);
  const nextHtml =
    idx === -1 ? `${html}${footerHtml}` : `${html.slice(0, idx)}${footerHtml}${closing}`;
  return {
    html: nextHtml,
    text: `${text}${footerText}`,
  };
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendEmailSafe(input: SendEmailInput) {
  const resend = getResend();
  const from = process.env.RESEND_FROM;
  if (!resend || !from) {
    console.warn("[email] Skipping send; missing RESEND_API_KEY or RESEND_FROM.", {
      to: input.to,
      subject: input.subject,
    });
    return { skipped: true };
  }

  try {
    return await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  } catch (error) {
    console.error("[email] send failed", error);
    return { error };
  }
}

export function buildMessageEmail(params: {
  senderName: string;
  messageBody: string;
  conversationUrl: string;
  carTitle?: string | null;
}) {
  const senderName = escapeHtml(params.senderName || "Someone");
  const messageBody = escapeHtml(params.messageBody || "");
  const carTitle = params.carTitle ? escapeHtml(params.carTitle) : null;
  const titleLine = carTitle ? `Listing: ${carTitle}` : "New message";

  const subject = `${appName}: New message from ${senderName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>${titleLine}</h2>
      <p><strong>${senderName}</strong> sent you a message:</p>
      <blockquote style="border-left: 3px solid #e5e7eb; margin: 16px 0; padding-left: 12px;">
        ${messageBody}
      </blockquote>
      <p>
        <a href="${params.conversationUrl}" style="color:#2563eb;">Open conversation</a>
      </p>
      <p style="color:#6b7280; font-size: 12px;">${appName}</p>
    </div>
  `;
  const text = `${titleLine}\n\n${senderName} sent you a message:\n\n${params.messageBody}\n\nOpen conversation: ${params.conversationUrl}\n\n${appName}`;

  return { subject, ...withOfficialFooter(html, text) };
}

export function buildHostDecisionEmail(params: {
  approved: boolean;
  hostName?: string | null;
  carTitle?: string | null;
  startDate: string;
  endDate: string;
  reason?: string | null;
}) {
  const hostName = escapeHtml(params.hostName || "Host");
  const carTitle = params.carTitle ? escapeHtml(params.carTitle) : "your booking";
  const subject = params.approved
    ? `${appName}: Booking confirmed by ${hostName}`
    : `${appName}: Booking rejected by ${hostName}`;

  const decisionLine = params.approved ? "approved" : "rejected";
  const reasonLine = params.approved
    ? ""
    : `<p><strong>Reason:</strong> ${escapeHtml(params.reason || "No reason provided.")}</p>`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Booking ${decisionLine}</h2>
      <p>Your booking for <strong>${carTitle}</strong> was ${decisionLine} by ${hostName}.</p>
      <p><strong>Dates:</strong> ${escapeHtml(params.startDate)} to ${escapeHtml(params.endDate)}</p>
      ${reasonLine}
      <p><a href="${siteUrl}/messages" style="color:#2563eb;">Open messages</a></p>
      <p style="color:#6b7280; font-size: 12px;">${appName}</p>
    </div>
  `;
  const text = `Booking ${decisionLine}\nYour booking for ${params.carTitle ?? "your booking"} was ${decisionLine} by ${
    params.hostName ?? "Host"
  }.\nDates: ${params.startDate} to ${params.endDate}${
    params.approved ? "" : `\nReason: ${params.reason ?? "No reason provided."}`
  }\nOpen messages: ${siteUrl}/messages\n\n${appName}`;

  return { subject, ...withOfficialFooter(html, text) };
}

export function buildBookingPaidEmail(params: {
  instantBook: boolean;
  carTitle?: string | null;
  startDate: string;
  endDate: string;
  totalPrice: number;
}) {
  const carTitle = params.carTitle ? escapeHtml(params.carTitle) : "your booking";
  const subject = params.instantBook
    ? `${appName}: Booking confirmed`
    : `${appName}: Booking request sent`;
  const statusLine = params.instantBook ? "confirmed" : "sent to the host for approval";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Payment received</h2>
      <p>Your booking for <strong>${carTitle}</strong> is ${statusLine}.</p>
      <p><strong>Dates:</strong> ${escapeHtml(params.startDate)} to ${escapeHtml(params.endDate)}</p>
      <p><strong>Total:</strong> ${params.totalPrice}</p>
      <p><a href="${siteUrl}/dashboard" style="color:#2563eb;">View booking</a></p>
      <p style="color:#6b7280; font-size: 12px;">${appName}</p>
    </div>
  `;
  const text = `Payment received\nYour booking for ${
    params.carTitle ?? "your booking"
  } is ${statusLine}.\nDates: ${params.startDate} to ${params.endDate}\nTotal: ${params.totalPrice}\nView booking: ${siteUrl}/dashboard\n\n${appName}`;

  return { subject, ...withOfficialFooter(html, text) };
}

export function buildHostBookingNoticeEmail(params: {
  instantBook: boolean;
  renterName?: string | null;
  carTitle?: string | null;
  startDate: string;
  endDate: string;
}) {
  const renterName = escapeHtml(params.renterName || "Guest");
  const carTitle = params.carTitle ? escapeHtml(params.carTitle) : "your listing";
  const subject = params.instantBook
    ? `${appName}: New booking confirmed`
    : `${appName}: New booking request`;
  const statusLine = params.instantBook
    ? "A new booking was confirmed instantly."
    : "A new booking request needs your approval.";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>${statusLine}</h2>
      <p><strong>${renterName}</strong> booked <strong>${carTitle}</strong>.</p>
      <p><strong>Dates:</strong> ${escapeHtml(params.startDate)} to ${escapeHtml(params.endDate)}</p>
      <p><a href="${siteUrl}/host/bookings" style="color:#2563eb;">Manage bookings</a></p>
      <p style="color:#6b7280; font-size: 12px;">${appName}</p>
    </div>
  `;
  const text = `${statusLine}\n${renterName} booked ${params.carTitle ?? "your listing"}.\nDates: ${
    params.startDate
  } to ${params.endDate}\nManage bookings: ${siteUrl}/host/bookings\n\n${appName}`;

  return { subject, ...withOfficialFooter(html, text) };
}

export function buildHostApplicationDecisionEmail(params: {
  approved: boolean;
  hostName?: string | null;
  reason?: string | null;
}) {
  const hostName = escapeHtml(params.hostName || "Host");
  const subject = params.approved
    ? `${appName}: Host application approved`
    : `${appName}: Host application rejected`;
  const decisionLine = params.approved
    ? "Your host application has been approved."
    : "Your host application has been rejected.";
  const reasonLine = params.approved
    ? ""
    : `<p><strong>Reason:</strong> ${escapeHtml(params.reason || "No reason provided.")}</p>`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>${decisionLine}</h2>
      <p>Hi ${hostName},</p>
      ${reasonLine}
      <p><a href="${siteUrl}/host" style="color:#2563eb;">Go to host dashboard</a></p>
      <p style="color:#6b7280; font-size: 12px;">${appName}</p>
    </div>
  `;
  const text = `${decisionLine}\nHi ${params.hostName ?? "Host"},${
    params.approved ? "" : `\nReason: ${params.reason ?? "No reason provided."}`
  }\nGo to host dashboard: ${siteUrl}/host\n\n${appName}`;

  return { subject, ...withOfficialFooter(html, text) };
}
