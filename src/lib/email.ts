import "server-only";
import { Resend } from "resend";

type SendEmailInput = {
  to: string | string[];
  replyTo?: string | string[];
  subject: string;
  html: string;
  text?: string;
  idempotencyKey?: string;
};

const appName = process.env.APP_NAME ?? "Hayame";
const siteUrl =
  process.env.EMAIL_BASE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://hayame.vercel.app");

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
    idx === -1
      ? `${html}${footerHtml}`
      : `${html.slice(0, idx)}${footerHtml}${closing}`;
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

function formatCurrency(value: number) {
  return `GHS ${Number(value ?? 0).toFixed(2)}`;
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return "N/A";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toUTCString();
}

export async function sendEmailSafe(input: SendEmailInput) {
  const resend = getResend();
  const from = process.env.RESEND_FROM;
  if (!resend || !from) {
    console.warn(
      "[email] Skipping send; missing RESEND_API_KEY or RESEND_FROM.",
      {
        to: input.to,
        subject: input.subject,
      },
    );
    return { skipped: true };
  }

  try {
    const payload: Record<string, unknown> = {
      from,
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      html: input.html,
      text: input.text,
    };
    if (input.idempotencyKey) {
      payload.headers = { "Idempotency-Key": input.idempotencyKey };
    }
    return await resend.emails.send(payload as any);
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
  const carTitle = params.carTitle
    ? escapeHtml(params.carTitle)
    : "your booking";
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
  tripUseLocation?: string | null;
  totalPrice: number;
  bookingId?: string | null;
  paymentReference?: string | null;
  bookedAt?: string | null;
  conversationUrl?: string | null;
}) {
  const carTitle = params.carTitle
    ? escapeHtml(params.carTitle)
    : "your booking";
  const subject = params.instantBook
    ? `${appName}: Booking confirmed`
    : `${appName}: Booking request sent`;
  const statusLine = params.instantBook
    ? "confirmed"
    : "sent to the host for approval";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Payment received</h2>
      <p>Your booking for <strong>${carTitle}</strong> is ${statusLine}.</p>
      <p><strong>Booked at:</strong> ${escapeHtml(formatDateTime(params.bookedAt))}</p>
      <p><strong>Booking ID:</strong> ${escapeHtml(params.bookingId ?? "N/A")}</p>
      <p><strong>Payment reference:</strong> ${escapeHtml(params.paymentReference ?? "N/A")}</p>
      <p><strong>Dates:</strong> ${escapeHtml(params.startDate)} to ${escapeHtml(params.endDate)}</p>
      ${params.tripUseLocation ? `<p><strong>Trip use location:</strong> ${escapeHtml(params.tripUseLocation)}</p>` : ""}
      <p><strong>Total:</strong> ${formatCurrency(params.totalPrice)}</p>
      <p><a href="${params.conversationUrl ?? `${siteUrl}/messages`}" style="color:#2563eb;">Open messages</a></p>
      <p style="color:#6b7280; font-size: 12px;">${appName}</p>
    </div>
  `;
  const text = `Payment received\nYour booking for ${
    params.carTitle ?? "your booking"
  } is ${statusLine}.\nBooked at: ${formatDateTime(params.bookedAt)}\nBooking ID: ${
    params.bookingId ?? "N/A"
  }\nPayment reference: ${params.paymentReference ?? "N/A"}\nDates: ${params.startDate} to ${
    params.endDate
  }${params.tripUseLocation ? `\nTrip use location: ${params.tripUseLocation}` : ""}\nTotal: ${formatCurrency(
    params.totalPrice,
  )}\nOpen messages: ${
    params.conversationUrl ?? `${siteUrl}/messages`
  }\n\n${appName}`;

  return { subject, ...withOfficialFooter(html, text) };
}

export function buildHostBookingNoticeEmail(params: {
  instantBook: boolean;
  renterName?: string | null;
  renterPhone?: string | null;
  carTitle?: string | null;
  startDate: string;
  endDate: string;
  tripUseLocation?: string | null;
  totalPrice: number;
  bookingId?: string | null;
  paymentReference?: string | null;
  bookedAt?: string | null;
  conversationUrl?: string | null;
}) {
  const renterName = escapeHtml(params.renterName || "Guest");
  const carTitle = params.carTitle
    ? escapeHtml(params.carTitle)
    : "your listing";
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
      <p><strong>Booked at:</strong> ${escapeHtml(formatDateTime(params.bookedAt))}</p>
      <p><strong>Booking ID:</strong> ${escapeHtml(params.bookingId ?? "N/A")}</p>
      <p><strong>Payment reference:</strong> ${escapeHtml(params.paymentReference ?? "N/A")}</p>
      <p><strong>Renter phone:</strong> ${escapeHtml(params.renterPhone ?? "Not provided")}</p>
      <p><strong>Dates:</strong> ${escapeHtml(params.startDate)} to ${escapeHtml(params.endDate)}</p>
      ${params.tripUseLocation ? `<p><strong>Trip use location:</strong> ${escapeHtml(params.tripUseLocation)}</p>` : ""}
      <p><strong>Total paid:</strong> ${formatCurrency(params.totalPrice)}</p>
      <p><a href="${params.conversationUrl ?? `${siteUrl}/messages`}" style="color:#2563eb;">Open messages</a></p>
      <p><a href="${siteUrl}/host/bookings" style="color:#2563eb;">Manage bookings</a></p>
      <p style="color:#6b7280; font-size: 12px;">${appName}</p>
    </div>
  `;
  const text = `${statusLine}\n${renterName} booked ${params.carTitle ?? "your listing"}.\nDates: ${
    params.startDate
  } to ${params.endDate}\nBooked at: ${formatDateTime(params.bookedAt)}\nBooking ID: ${
    params.bookingId ?? "N/A"
  }\nPayment reference: ${params.paymentReference ?? "N/A"}\nRenter phone: ${
    params.renterPhone ?? "Not provided"
  }${params.tripUseLocation ? `\nTrip use location: ${params.tripUseLocation}` : ""}\nTotal paid: ${formatCurrency(
    params.totalPrice,
  )}\nOpen messages: ${
    params.conversationUrl ?? `${siteUrl}/messages`
  }\nManage bookings: ${siteUrl}/host/bookings\n\n${appName}`;

  return { subject, ...withOfficialFooter(html, text) };
}

export function buildBookingInvoiceEmail(params: {
  recipientRole: "renter" | "host";
  recipientName?: string | null;
  counterpartName?: string | null;
  carTitle?: string | null;
  bookingId: string;
  paymentReference?: string | null;
  bookedAt?: string | null;
  startDate: string;
  endDate: string;
  nights: number;
  dailyRate: number;
  subtotal: number;
  platformFee: number;
  insuranceFee: number;
  deliveryFee: number;
  outsideAccraSurcharge: number;
  depositAmount: number;
  totalPrice: number;
  status: string;
  conversationUrl?: string | null;
  tripUseLocation?: string | null;
}) {
  const recipient = escapeHtml(
    params.recipientName ||
      (params.recipientRole === "host" ? "Host" : "Guest"),
  );
  const counterpart = escapeHtml(
    params.counterpartName ||
      (params.recipientRole === "host" ? "Guest" : "Host"),
  );
  const carTitle = escapeHtml(params.carTitle || "Listing");
  const invoiceRef = `INV-${params.bookingId.slice(0, 8).toUpperCase()}`;
  const subject = `${appName}: Booking invoice ${invoiceRef}`;
  const roleNote =
    params.recipientRole === "host"
      ? `Your listing was booked by ${counterpart}.`
      : `Your trip booking with ${counterpart} is recorded.`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Booking invoice</h2>
      <p>Hello ${recipient},</p>
      <p>${roleNote}</p>
      <p><strong>Invoice:</strong> ${invoiceRef}</p>
      <p><strong>Booking ID:</strong> ${escapeHtml(params.bookingId)}</p>
      <p><strong>Payment reference:</strong> ${escapeHtml(params.paymentReference ?? "N/A")}</p>
      <p><strong>Booked at:</strong> ${escapeHtml(formatDateTime(params.bookedAt))}</p>
      <p><strong>Listing:</strong> ${carTitle}</p>
      <p><strong>Trip dates:</strong> ${escapeHtml(params.startDate)} to ${escapeHtml(params.endDate)} (${params.nights} night(s))</p>
      ${params.tripUseLocation ? `<p><strong>Trip use location:</strong> ${escapeHtml(params.tripUseLocation)}</p>` : ""}
      <p><strong>Status:</strong> ${escapeHtml(params.status)}</p>
      <hr style="margin: 16px 0; border: 0; border-top: 1px solid #e5e7eb;" />
      <p><strong>Daily rate:</strong> ${formatCurrency(params.dailyRate)}</p>
      <p><strong>Subtotal:</strong> ${formatCurrency(params.subtotal)}</p>
      <p><strong>Platform fee:</strong> ${formatCurrency(params.platformFee)}</p>
      <p><strong>Insurance fee:</strong> ${formatCurrency(params.insuranceFee)}</p>
      <p><strong>Delivery fee:</strong> ${formatCurrency(params.deliveryFee)}</p>
      <p><strong>Outside Accra surcharge:</strong> ${formatCurrency(params.outsideAccraSurcharge)}</p>
      <p><strong>Deposit:</strong> ${formatCurrency(params.depositAmount)}</p>
      <p><strong>Total paid:</strong> ${formatCurrency(params.totalPrice)}</p>
      <p><a href="${params.conversationUrl ?? `${siteUrl}/messages`}" style="color:#2563eb;">Open messages</a></p>
      <p style="color:#6b7280; font-size: 12px;">${appName}</p>
    </div>
  `;

  const text = `Booking invoice
Invoice: ${invoiceRef}
Booking ID: ${params.bookingId}
Payment reference: ${params.paymentReference ?? "N/A"}
Booked at: ${formatDateTime(params.bookedAt)}
Listing: ${params.carTitle ?? "Listing"}
Trip dates: ${params.startDate} to ${params.endDate} (${params.nights} night(s))
${params.tripUseLocation ? `Trip use location: ${params.tripUseLocation}\n` : ""}Status: ${params.status}

Daily rate: ${formatCurrency(params.dailyRate)}
Subtotal: ${formatCurrency(params.subtotal)}
Platform fee: ${formatCurrency(params.platformFee)}
Insurance fee: ${formatCurrency(params.insuranceFee)}
Delivery fee: ${formatCurrency(params.deliveryFee)}
Outside Accra surcharge: ${formatCurrency(params.outsideAccraSurcharge)}
Deposit: ${formatCurrency(params.depositAmount)}
Total paid: ${formatCurrency(params.totalPrice)}

Open messages: ${params.conversationUrl ?? `${siteUrl}/messages`}

${appName}`;

  return { subject, ...withOfficialFooter(html, text) };
}

export function buildConversationStartedEmail(params: {
  starterName: string;
  conversationUrl: string;
  carTitle?: string | null;
}) {
  const starterName = escapeHtml(params.starterName || "Someone");
  const carTitle = params.carTitle ? escapeHtml(params.carTitle) : null;
  const subject = `${appName}: New chat started`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>New conversation</h2>
      <p><strong>${starterName}</strong> started a conversation with you.</p>
      ${carTitle ? `<p><strong>Listing:</strong> ${carTitle}</p>` : ""}
      <p><a href="${params.conversationUrl}" style="color:#2563eb;">Open conversation</a></p>
      <p style="color:#6b7280; font-size: 12px;">${appName}</p>
    </div>
  `;
  const text = `${starterName} started a conversation with you.${
    carTitle ? `\nListing: ${params.carTitle}` : ""
  }\nOpen conversation: ${params.conversationUrl}\n\n${appName}`;
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

export function buildHostApplicationSubmittedEmail(params: {
  hostName?: string | null;
}) {
  const hostName = escapeHtml(params.hostName || "Host");
  const subject = `${appName}: Host application received`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Your host application has been received.</h2>
      <p>Hi ${hostName},</p>
      <p>Thanks for applying to become a host on ${appName}. Your request is now under review.</p>
      <p>Most applications are reviewed within 1-2 business days.</p>
      <p><a href="${siteUrl}/become-host" style="color:#2563eb;">View your host application</a></p>
      <p style="color:#6b7280; font-size: 12px;">${appName}</p>
    </div>
  `;
  const text = `Your host application has been received.
Hi ${params.hostName ?? "Host"},
Thanks for applying to become a host on ${appName}. Your request is now under review.
Most applications are reviewed within 1-2 business days.
View your host application: ${siteUrl}/become-host

${appName}`;

  return { subject, ...withOfficialFooter(html, text) };
}

export function buildSupportRequestEmail(params: {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  submittedAt: string;
}) {
  const subject = `${appName}: Support request from ${params.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>New support request</h2>
      <p><strong>Name:</strong> ${escapeHtml(params.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(params.email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(params.phone || "Not provided")}</p>
      <p><strong>Submitted at:</strong> ${escapeHtml(formatDateTime(params.submittedAt))}</p>
      <p><strong>Message:</strong></p>
      <blockquote style="border-left: 3px solid #e5e7eb; margin: 16px 0; padding-left: 12px; white-space: pre-wrap;">
        ${escapeHtml(params.message)}
      </blockquote>
    </div>
  `;
  const text = `New support request\nName: ${params.name}\nEmail: ${params.email}\nPhone: ${
    params.phone || "Not provided"
  }\nSubmitted at: ${formatDateTime(params.submittedAt)}\n\n${params.message}`;
  return { subject, ...withOfficialFooter(html, text) };
}

export function buildSupportAcknowledgementEmail(params: {
  name: string;
  supportEmail: string;
}) {
  const subject = `${appName}: We received your message`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>We received your message</h2>
      <p>Hi ${escapeHtml(params.name)},</p>
      <p>Thanks for contacting ${appName}. Our support team has your message and will reply within one business day.</p>
      <p>If your issue is urgent, you can also reach us at <a href="mailto:${escapeHtml(params.supportEmail)}">${escapeHtml(params.supportEmail)}</a>.</p>
    </div>
  `;
  const text = `Hi ${params.name},\n\nThanks for contacting ${appName}. Our support team has your message and will reply within one business day.\n\nIf your issue is urgent, you can also reach us at ${params.supportEmail}.`;
  return { subject, ...withOfficialFooter(html, text) };
}

export function buildListingDecisionEmail(params: {
  approved: boolean;
  hostName?: string | null;
  carTitle?: string | null;
  reason?: string | null;
}) {
  const hostName = escapeHtml(params.hostName || "Host");
  const carTitle = params.carTitle ? escapeHtml(params.carTitle) : "your listing";
  const subject = params.approved
    ? `${appName}: Listing approved`
    : `${appName}: Listing needs changes`;
  const decisionLine = params.approved
    ? `Your listing ${carTitle} has been approved and is now live for renters.`
    : `Your listing ${carTitle} was not approved.`;
  const reasonLine =
    !params.approved && params.reason
      ? `<p><strong>Reason:</strong> ${escapeHtml(params.reason)}</p>`
      : "";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>${params.approved ? "Listing approved" : "Listing update"}</h2>
      <p>Hi ${hostName},</p>
      <p>${decisionLine}</p>
      ${reasonLine}
      <p><a href="${siteUrl}/host/cars" style="color:#2563eb;">Manage your listings</a></p>
      <p style="color:#6b7280; font-size: 12px;">${appName}</p>
    </div>
  `;
  const text = `${params.approved ? "Listing approved" : "Listing update"}\nHi ${
    params.hostName ?? "Host"
  },\n${params.approved ? `Your listing ${params.carTitle ?? "your listing"} has been approved and is now live for renters.` : `Your listing ${params.carTitle ?? "your listing"} was not approved.`}${
    !params.approved && params.reason ? `\nReason: ${params.reason}` : ""
  }\nManage your listings: ${siteUrl}/host/cars\n\n${appName}`;

  return { subject, ...withOfficialFooter(html, text) };
}

export function buildBookingCancelledEmail(params: {
  recipientRole: "host" | "renter";
  carTitle?: string | null;
  startDate: string;
  endDate: string;
  totalPrice: number;
  refundAmount: number;
  policyLabel?: string | null;
  bookingId?: string | null;
}) {
  const carTitle = params.carTitle ? escapeHtml(params.carTitle) : "the booking";
  const isHost = params.recipientRole === "host";
  const subject = isHost
    ? `${appName}: A booking was cancelled`
    : `${appName}: Your booking was cancelled`;
  const heading = isHost ? "Booking cancelled by guest" : "Booking cancelled";
  const intro = isHost
    ? `The guest cancelled their booking for <strong>${carTitle}</strong>. These dates are now open again.`
    : `Your booking for <strong>${carTitle}</strong> has been cancelled.`;
  const refundLine = isHost
    ? ""
    : `<p><strong>Refund:</strong> ${formatCurrency(params.refundAmount)} of ${formatCurrency(params.totalPrice)}${
        params.policyLabel
          ? ` (per the ${escapeHtml(params.policyLabel)} cancellation policy)`
          : ""
      }. Refunds are returned to your original payment method by Paystack.</p>`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>${heading}</h2>
      <p>${intro}</p>
      <p><strong>Dates:</strong> ${escapeHtml(params.startDate)} to ${escapeHtml(params.endDate)}</p>
      ${refundLine}
      ${params.bookingId ? `<p><strong>Booking ID:</strong> ${escapeHtml(params.bookingId)}</p>` : ""}
      <p><a href="${siteUrl}/${isHost ? "host/bookings" : "dashboard/bookings"}" style="color:#2563eb;">View bookings</a></p>
      <p style="color:#6b7280; font-size: 12px;">${appName}</p>
    </div>
  `;
  const text = `${heading}\n${
    isHost
      ? `The guest cancelled their booking for ${params.carTitle ?? "the booking"}. These dates are now open again.`
      : `Your booking for ${params.carTitle ?? "the booking"} has been cancelled.`
  }\nDates: ${params.startDate} to ${params.endDate}${
    isHost
      ? ""
      : `\nRefund: ${formatCurrency(params.refundAmount)} of ${formatCurrency(params.totalPrice)}${
          params.policyLabel ? ` (per the ${params.policyLabel} cancellation policy)` : ""
        }.`
  }\nView bookings: ${siteUrl}/${isHost ? "host/bookings" : "dashboard/bookings"}\n\n${appName}`;

  return { subject, ...withOfficialFooter(html, text) };
}
