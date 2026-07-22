import "server-only";
import { Resend } from "resend";

export type EmailAttachment = {
  /** File name shown to the recipient, e.g. "invoice.pdf". */
  filename: string;
  /** Raw bytes, base64-encoded (no data: prefix). */
  content: string;
  contentType?: string;
};

type SendEmailInput = {
  to: string | string[];
  replyTo?: string | string[];
  subject: string;
  html: string;
  text?: string;
  idempotencyKey?: string;
  attachments?: EmailAttachment[];
};

const appName = process.env.APP_NAME ?? "Hayame";
const siteUrl =
  process.env.EMAIL_BASE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://hayame.vercel.app");
const supportEmail =
  process.env.SUPPORT_INBOX_EMAIL?.trim() ||
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
  "support@hayamegh.com";
const supportAddress =
  process.env.NEXT_PUBLIC_SUPPORT_ADDRESS?.trim() ||
  "Accra Digital Centre, Ring Road West";
// The logo must be a publicly reachable HTTPS URL for email clients. Dev
// site URLs are LAN addresses, so fall back to the production asset.
const logoUrl =
  process.env.EMAIL_LOGO_URL?.trim() ||
  (siteUrl.startsWith("https://")
    ? `${siteUrl}/logo.png`
    : "https://www.hayamegh.com/logo.png");

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Brand tokens mirrored from tailwind.config.ts / globals.css so emails match
// the website (email clients need inline styles; CSS vars are unavailable).
const BRAND = "#0e86d4";
const INK = "#0b1220";
const MUTED = "#6b7280";
const FAINT = "#9ca3af";
const BORDER = "#e6e9ef";
const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function ctaButton(href: string, label: string) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px 0 4px;">
      <tr>
        <td style="border-radius: 10px; background-color: ${BRAND};">
          <a href="${href}" style="display:inline-block; padding: 12px 28px; font-family: ${FONT_STACK}; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px;">${label}</a>
        </td>
      </tr>
    </table>`;
}

function metaRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding: 7px 16px 7px 0; font-size: 13px; color: ${MUTED}; white-space: nowrap; vertical-align: top;">${label}</td>
      <td style="padding: 7px 0; font-size: 13px; color: ${INK}; font-weight: 500; text-align: right; word-break: break-all;">${value}</td>
    </tr>`;
}

function amountRow(label: string, value: string, opts?: { muted?: boolean }) {
  return `
    <tr>
      <td style="padding: 8px 0; font-size: 14px; color: ${opts?.muted ? FAINT : MUTED};">${label}</td>
      <td style="padding: 8px 0; font-size: 14px; color: ${INK}; text-align: right; font-variant-numeric: tabular-nums;">${value}</td>
    </tr>`;
}

function statusPill(status: string) {
  const normalized = status.toLowerCase();
  const styles: Record<string, { bg: string; fg: string; label: string }> = {
    confirmed: { bg: "#dcfce7", fg: "#15803d", label: "Confirmed" },
    awaiting_host: {
      bg: "#fef3c7",
      fg: "#b45309",
      label: "Awaiting host approval",
    },
    cancelled: { bg: "#fee2e2", fg: "#b91c1c", label: "Cancelled" },
    rejected: { bg: "#fee2e2", fg: "#b91c1c", label: "Rejected" },
    refunded: { bg: "#e0f2fe", fg: "#0a6aa9", label: "Refunded" },
    completed: { bg: "#e0f2fe", fg: "#0a6aa9", label: "Completed" },
  };
  const s = styles[normalized] ?? {
    bg: "#f4f4f5",
    fg: MUTED,
    label: status,
  };
  return `<span style="display:inline-block; padding: 4px 12px; border-radius: 999px; background-color:${s.bg}; color:${s.fg}; font-size: 12px; font-weight: 600;">${escapeHtml(s.label)}</span>`;
}

function withOfficialFooter(html: string, text: string) {
  const footerText = `\n\nThis is an official notification from ${appName}.\nThis email was sent from a no-reply address that is not monitored. Need help? Contact ${supportEmail}.\n${appName} · ${supportAddress}\nVisit ${siteUrl}\n`;
  const brandedHtml = `
  <div style="background-color:#f4f6f8; padding: 32px 16px; font-family: ${FONT_STACK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
      <tr>
        <td align="center" style="padding: 0 0 24px;">
          <a href="${siteUrl}" style="text-decoration:none;">
            <img src="${logoUrl}" alt="${appName}" width="132" style="display:block; width:132px; max-width:50%; height:auto; border:0;" />
          </a>
        </td>
      </tr>
      <tr>
        <td style="background-color:#ffffff; border:1px solid ${BORDER}; border-top: 4px solid ${BRAND}; border-radius: 16px; padding: 32px; font-family: ${FONT_STACK}; color: ${INK};">
          ${html}
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 24px 8px 0; font-family: ${FONT_STACK}; font-size: 12px; line-height: 1.7; color: ${FAINT};">
          This is an official notification from ${appName}.<br />
          Sent from a no-reply address that is not monitored &mdash; need help? <a href="mailto:${supportEmail}" style="color:${BRAND}; text-decoration:none;">${supportEmail}</a><br />
          ${appName} &middot; ${escapeHtml(supportAddress)}<br />
          <a href="${siteUrl}" style="color:${BRAND}; text-decoration:none;">Visit ${appName}</a>
        </td>
      </tr>
    </table>
  </div>`;
  return {
    html: brandedHtml,
    text: `${text}${footerText}`,
  };
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function formatCurrency(value: number) {
  // Same formatter the website uses (src/lib/utils.ts), with pesewas shown —
  // official invoices and receipts should carry exact amounts.
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
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
      // The sender is a no-reply mailbox; route replies to support by default.
      replyTo: input.replyTo ?? supportEmail,
      subject: input.subject,
      html: input.html,
      text: input.text,
    };
    if (input.attachments?.length) {
      payload.attachments = input.attachments.map((file) => ({
        filename: file.filename,
        content: file.content,
        contentType: file.contentType,
      }));
    }
    // The idempotency key must go in the request OPTIONS (HTTP header), not in
    // payload.headers — the latter only stamps a MIME header on the email and
    // performs no deduplication.
    return await resend.emails.send(
      payload as any,
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {},
    );
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
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <h2>${titleLine}</h2>
      <p><strong>${senderName}</strong> sent you a message:</p>
      <blockquote style="border-left: 3px solid #e5e7eb; margin: 16px 0; padding-left: 12px;">
        ${messageBody}
      </blockquote>
      <p>
        <a href="${params.conversationUrl}" style="color:${BRAND};">Open conversation</a>
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
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <h2>Booking ${decisionLine}</h2>
      <p>Your booking for <strong>${carTitle}</strong> was ${decisionLine} by ${hostName}.</p>
      <p><strong>Dates:</strong> ${escapeHtml(params.startDate)} to ${escapeHtml(params.endDate)}</p>
      ${reasonLine}
      <p><a href="${siteUrl}/messages" style="color:${BRAND};">Open messages</a></p>
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
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <h2>Payment received</h2>
      <p>Your booking for <strong>${carTitle}</strong> is ${statusLine}.</p>
      <p><strong>Booked at:</strong> ${escapeHtml(formatDateTime(params.bookedAt))}</p>
      <p><strong>Booking ID:</strong> ${escapeHtml(params.bookingId ?? "N/A")}</p>
      <p><strong>Payment reference:</strong> ${escapeHtml(params.paymentReference ?? "N/A")}</p>
      <p><strong>Dates:</strong> ${escapeHtml(params.startDate)} to ${escapeHtml(params.endDate)}</p>
      ${params.tripUseLocation ? `<p><strong>Trip use location:</strong> ${escapeHtml(params.tripUseLocation)}</p>` : ""}
      <p><strong>Total:</strong> ${formatCurrency(params.totalPrice)}</p>
      <p><a href="${params.conversationUrl ?? `${siteUrl}/messages`}" style="color:${BRAND};">Open messages</a></p>
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
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <h2>${statusLine}</h2>
      <p><strong>${renterName}</strong> booked <strong>${carTitle}</strong>.</p>
      <p><strong>Booked at:</strong> ${escapeHtml(formatDateTime(params.bookedAt))}</p>
      <p><strong>Booking ID:</strong> ${escapeHtml(params.bookingId ?? "N/A")}</p>
      <p><strong>Payment reference:</strong> ${escapeHtml(params.paymentReference ?? "N/A")}</p>
      <p><strong>Renter phone:</strong> ${escapeHtml(params.renterPhone ?? "Not provided")}</p>
      <p><strong>Dates:</strong> ${escapeHtml(params.startDate)} to ${escapeHtml(params.endDate)}</p>
      ${params.tripUseLocation ? `<p><strong>Trip use location:</strong> ${escapeHtml(params.tripUseLocation)}</p>` : ""}
      <p><strong>Total paid:</strong> ${formatCurrency(params.totalPrice)}</p>
      <p><a href="${params.conversationUrl ?? `${siteUrl}/messages`}" style="color:${BRAND};">Open messages</a></p>
      <p><a href="${siteUrl}/host/bookings" style="color:${BRAND};">Manage bookings</a></p>
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

  const nightsLabel = `${params.nights} night${params.nights === 1 ? "" : "s"}`;
  const html = `
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${BRAND};">Booking invoice</p>
            <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">${invoiceRef}</h1>
            <p style="margin: 4px 0 0; font-size: 13px; color: ${MUTED};">${escapeHtml(formatDateTime(params.bookedAt))}</p>
          </td>
          <td align="right" style="vertical-align: top;">${statusPill(params.status)}</td>
        </tr>
      </table>

      <p style="margin: 24px 0 4px; font-size: 15px;">Hello ${recipient},</p>
      <p style="margin: 0 0 20px; font-size: 14px; color: ${MUTED};">${roleNote}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border:1px solid ${BORDER}; border-radius: 12px; margin: 0 0 24px;">
        <tr><td style="padding: 16px 20px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${metaRow("Listing", carTitle)}
            ${metaRow("Trip dates", `${escapeHtml(params.startDate)} &rarr; ${escapeHtml(params.endDate)} <span style="color:${MUTED};">(${nightsLabel})</span>`)}
            ${params.tripUseLocation ? metaRow("Trip location", escapeHtml(params.tripUseLocation)) : ""}
            ${metaRow("Booking ID", escapeHtml(params.bookingId))}
            ${metaRow("Payment reference", escapeHtml(params.paymentReference ?? "N/A"))}
          </table>
        </td></tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${amountRow(`Daily rate &times; ${nightsLabel}`, formatCurrency(params.subtotal))}
        ${amountRow("Platform fee", formatCurrency(params.platformFee))}
        ${amountRow("Insurance fee", formatCurrency(params.insuranceFee))}
        ${params.deliveryFee > 0 ? amountRow("Delivery fee", formatCurrency(params.deliveryFee)) : ""}
        ${params.outsideAccraSurcharge > 0 ? amountRow("Outside-region surcharge", formatCurrency(params.outsideAccraSurcharge)) : ""}
        ${amountRow("Security deposit (refundable)", formatCurrency(params.depositAmount))}
        <tr>
          <td style="padding: 14px 0 0; border-top: 2px solid ${INK}; font-size: 16px; font-weight: 700;">Total paid</td>
          <td style="padding: 14px 0 0; border-top: 2px solid ${INK}; font-size: 20px; font-weight: 700; color: ${BRAND}; text-align: right; font-variant-numeric: tabular-nums;">${formatCurrency(params.totalPrice)}</td>
        </tr>
      </table>

      ${ctaButton(params.conversationUrl ?? `${siteUrl}/messages`, "Open messages")}
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

export function buildRefundReceiptEmail(params: {
  recipientRole: "renter" | "host";
  recipientName?: string | null;
  carTitle?: string | null;
  bookingId?: string | null;
  paymentReference?: string | null;
  refundReference?: string | null;
  refundAmount: number;
  totalPaid?: number | null;
  reason?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  refundedAt?: string | Date | null;
}) {
  const isHost = params.recipientRole === "host";
  const recipient = escapeHtml(
    params.recipientName || (isHost ? "Host" : "Guest"),
  );
  const carTitle = params.carTitle ? escapeHtml(params.carTitle) : null;
  const receiptSource = params.bookingId ?? params.paymentReference ?? "manual";
  const receiptRef = `RFD-${receiptSource.slice(0, 8).toUpperCase()}`;
  const subject = isHost
    ? `${appName}: Refund issued to guest ${receiptRef}`
    : `${appName}: Refund receipt ${receiptRef}`;
  const intro = isHost
    ? `A refund was issued to the guest for a booking on your listing <strong>${carTitle ?? "your listing"}</strong>. No action is needed from you — this is your official record of the refund.`
    : `Your refund has been initiated. This is your official refund receipt from ${appName}.`;
  const html = `
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${BRAND};">${isHost ? "Refund record" : "Refund receipt"}</p>
            <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">${receiptRef}</h1>
            <p style="margin: 4px 0 0; font-size: 13px; color: ${MUTED};">${escapeHtml(formatDateTime(params.refundedAt ?? new Date()))}</p>
          </td>
          <td align="right" style="vertical-align: top;">${statusPill("refunded")}</td>
        </tr>
      </table>

      <p style="margin: 24px 0 4px; font-size: 15px;">Hello ${recipient},</p>
      <p style="margin: 0 0 20px; font-size: 14px; color: ${MUTED};">${intro}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e0f2fe; border-radius: 12px; margin: 0 0 24px;">
        <tr><td align="center" style="padding: 22px 20px;">
          <p style="margin: 0 0 2px; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #0a6aa9;">Refund amount</p>
          <p style="margin: 0; font-size: 32px; font-weight: 700; color: ${INK}; font-variant-numeric: tabular-nums;">${formatCurrency(params.refundAmount)}</p>
          ${
            typeof params.totalPaid === "number" &&
            params.totalPaid > 0 &&
            params.totalPaid !== params.refundAmount
              ? `<p style="margin: 4px 0 0; font-size: 13px; color: #0a6aa9;">of ${formatCurrency(params.totalPaid)} originally paid</p>`
              : ""
          }
        </td></tr>
      </table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border:1px solid ${BORDER}; border-radius: 12px; margin: 0 0 20px;">
        <tr><td style="padding: 16px 20px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${carTitle ? metaRow("Listing", carTitle) : ""}
            ${params.startDate && params.endDate ? metaRow("Trip dates", `${escapeHtml(params.startDate)} &rarr; ${escapeHtml(params.endDate)}`) : ""}
            ${params.reason ? metaRow("Reason", escapeHtml(params.reason)) : ""}
            ${params.bookingId ? metaRow("Booking ID", escapeHtml(params.bookingId)) : ""}
            ${metaRow("Payment reference", escapeHtml(params.paymentReference ?? "N/A"))}
            ${metaRow("Refund reference", escapeHtml(params.refundReference ?? params.paymentReference ?? "N/A"))}
          </table>
        </td></tr>
      </table>

      ${
        isHost
          ? ""
          : `<p style="margin: 0; font-size: 13px; color: ${MUTED};">Refunds are returned by Paystack to the original payment method (card or mobile money). Depending on your bank or provider this can take up to 5&ndash;10 business days.</p>`
      }
    </div>
  `;

  const text = `Refund ${isHost ? "issued" : "receipt"}
Hello ${params.recipientName || (isHost ? "Host" : "Guest")},
${
  isHost
    ? `A refund was issued to the guest for a booking on your listing ${params.carTitle ?? "Listing"}. No action is needed from you — this is your official record of the refund.`
    : `Your refund has been initiated. This is your official refund receipt from ${appName}.`
}
Receipt: ${receiptRef}
${params.bookingId ? `Booking ID: ${params.bookingId}\n` : ""}Payment reference: ${params.paymentReference ?? "N/A"}
Refund reference: ${params.refundReference ?? params.paymentReference ?? "N/A"}
${params.carTitle ? `Listing: ${params.carTitle}\n` : ""}${params.startDate && params.endDate ? `Trip dates: ${params.startDate} to ${params.endDate}\n` : ""}${params.reason ? `Reason: ${params.reason}\n` : ""}Refunded at: ${formatDateTime(params.refundedAt ?? new Date())}

${typeof params.totalPaid === "number" && params.totalPaid > 0 ? `Original amount paid: ${formatCurrency(params.totalPaid)}\n` : ""}Refund amount: ${formatCurrency(params.refundAmount)}
${isHost ? "" : "Refunds are returned by Paystack to the original payment method (card or mobile money). Depending on your bank or provider this can take up to 5-10 business days.\n"}
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
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <h2>New conversation</h2>
      <p><strong>${starterName}</strong> started a conversation with you.</p>
      ${carTitle ? `<p><strong>Listing:</strong> ${carTitle}</p>` : ""}
      <p><a href="${params.conversationUrl}" style="color:${BRAND};">Open conversation</a></p>
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
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <h2>${decisionLine}</h2>
      <p>Hi ${hostName},</p>
      ${reasonLine}
      <p><a href="${siteUrl}/host" style="color:${BRAND};">Go to host dashboard</a></p>
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
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <h2>Your host application has been received.</h2>
      <p>Hi ${hostName},</p>
      <p>Thanks for applying to become a host on ${appName}. Your request is now under review.</p>
      <p>Most applications are reviewed within 1-2 business days.</p>
      <p><a href="${siteUrl}/become-host" style="color:${BRAND};">View your host application</a></p>
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
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
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
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
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
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <h2>${params.approved ? "Listing approved" : "Listing update"}</h2>
      <p>Hi ${hostName},</p>
      <p>${decisionLine}</p>
      ${reasonLine}
      <p><a href="${siteUrl}/host/cars" style="color:${BRAND};">Manage your listings</a></p>
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

// Sends the official refund receipt to the renter and (when provided) the
// refund record to the host. Used by every path that issues a Paystack refund
// — renter cancellation, host rejection, and the automatic safety refunds —
// so all platforms (web, iOS, Android) get identical official emails.
export async function sendRefundReceiptEmails(params: {
  renterEmail?: string | null;
  hostEmail?: string | null;
  renterName?: string | null;
  hostName?: string | null;
  carTitle?: string | null;
  bookingId?: string | null;
  paymentReference?: string | null;
  refundReference?: string | null;
  refundAmount: number;
  totalPaid?: number | null;
  reason?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  refundedAt?: string | Date | null;
}) {
  const idSource =
    params.bookingId ?? params.paymentReference ?? "unknown";
  if (params.renterEmail) {
    const receipt = buildRefundReceiptEmail({
      recipientRole: "renter",
      recipientName: params.renterName,
      carTitle: params.carTitle,
      bookingId: params.bookingId,
      paymentReference: params.paymentReference,
      refundReference: params.refundReference,
      refundAmount: params.refundAmount,
      totalPaid: params.totalPaid,
      reason: params.reason,
      startDate: params.startDate,
      endDate: params.endDate,
      refundedAt: params.refundedAt,
    });
    await sendEmailSafe({
      to: params.renterEmail,
      ...receipt,
      idempotencyKey: `refund:${idSource}:receipt:renter`,
    });
  }
  if (params.hostEmail) {
    const record = buildRefundReceiptEmail({
      recipientRole: "host",
      recipientName: params.hostName,
      carTitle: params.carTitle,
      bookingId: params.bookingId,
      paymentReference: params.paymentReference,
      refundReference: params.refundReference,
      refundAmount: params.refundAmount,
      totalPaid: params.totalPaid,
      reason: params.reason,
      startDate: params.startDate,
      endDate: params.endDate,
      refundedAt: params.refundedAt,
    });
    await sendEmailSafe({
      to: params.hostEmail,
      ...record,
      idempotencyKey: `refund:${idSource}:receipt:host`,
    });
  }
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
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <h2>${heading}</h2>
      <p>${intro}</p>
      <p><strong>Dates:</strong> ${escapeHtml(params.startDate)} to ${escapeHtml(params.endDate)}</p>
      ${refundLine}
      ${params.bookingId ? `<p><strong>Booking ID:</strong> ${escapeHtml(params.bookingId)}</p>` : ""}
      <p><a href="${siteUrl}/${isHost ? "host/bookings" : "dashboard/bookings"}" style="color:${BRAND};">View bookings</a></p>
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

/* -------------------------------------------------------------------------
 * Authentication emails.
 *
 * These used to be sent by Supabase itself, which meant Supabase's own
 * templates ("Confirm your signup" over a bare Supabase layout) and Supabase's
 * shared, heavily rate-limited SMTP. Both were user-visible problems: the
 * letters didn't look like Hayame, and the rate limiter silently dropped
 * verification mail so accounts were stranded unconfirmed.
 *
 * We now generate the action link with the admin API and deliver it ourselves
 * through Resend, so auth mail uses the same branded shell as every other
 * Hayame notification.
 * ---------------------------------------------------------------------- */

function firstNameOf(name?: string | null) {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return null;
  return escapeHtml(trimmed.split(/\s+/)[0]);
}

export function buildVerifyEmail(params: {
  verifyUrl: string;
  fullName?: string | null;
}) {
  const greetingName = firstNameOf(params.fullName);
  const greeting = greetingName ? `Hi ${greetingName},` : "Hi there,";
  const subject = `${appName}: Verify your email address`;

  const html = `
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">Verify your email address</h2>
      <p style="margin: 0 0 12px;">${greeting}</p>
      <p style="margin: 0 0 12px;">
        Welcome to ${appName}. Confirm this email address to activate your
        account &mdash; you won't be able to log in until you do.
      </p>
      ${ctaButton(params.verifyUrl, "Verify my email")}
      <p style="margin: 24px 0 8px; font-size: 13px; color: ${MUTED};">
        This link expires in 24 hours. If the button doesn't work, copy this
        address into your browser:
      </p>
      <p style="margin: 0 0 20px; font-size: 12px; word-break: break-all;">
        <a href="${params.verifyUrl}" style="color:${BRAND}; text-decoration:none;">${escapeHtml(params.verifyUrl)}</a>
      </p>
      <p style="margin: 0; font-size: 13px; color: ${MUTED};">
        If you didn't create a ${appName} account, you can ignore this email and
        nothing will happen.
      </p>
    </div>
  `;
  const text = `Verify your email address\n\nWelcome to ${appName}. Confirm this email address to activate your account — you won't be able to log in until you do.\n\nVerify my email: ${params.verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create a ${appName} account, you can ignore this email.`;

  return { subject, ...withOfficialFooter(html, text) };
}

export function buildPasswordResetEmail(params: {
  resetUrl: string;
  fullName?: string | null;
}) {
  const greetingName = firstNameOf(params.fullName);
  const greeting = greetingName ? `Hi ${greetingName},` : "Hi there,";
  const subject = `${appName}: Reset your password`;

  const html = `
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">Reset your password</h2>
      <p style="margin: 0 0 12px;">${greeting}</p>
      <p style="margin: 0 0 12px;">
        We received a request to reset the password for your ${appName} account.
        Choose a new one using the button below.
      </p>
      ${ctaButton(params.resetUrl, "Choose a new password")}
      <p style="margin: 24px 0 8px; font-size: 13px; color: ${MUTED};">
        This link expires in 1 hour and can only be used once. If the button
        doesn't work, copy this address into your browser:
      </p>
      <p style="margin: 0 0 20px; font-size: 12px; word-break: break-all;">
        <a href="${params.resetUrl}" style="color:${BRAND}; text-decoration:none;">${escapeHtml(params.resetUrl)}</a>
      </p>
      <p style="margin: 0; font-size: 13px; color: ${MUTED};">
        If you didn't ask to reset your password, ignore this email &mdash; your
        current password stays active and unchanged.
      </p>
    </div>
  `;
  const text = `Reset your password\n\nWe received a request to reset the password for your ${appName} account.\n\nChoose a new password: ${params.resetUrl}\n\nThis link expires in 1 hour and can only be used once.\n\nIf you didn't ask to reset your password, ignore this email — your current password stays active.`;

  return { subject, ...withOfficialFooter(html, text) };
}

/**
 * Free-form message composed by an admin in the dashboard. The body is plain
 * text typed by a human; we escape it and turn blank lines into paragraphs so
 * an admin never has to write HTML (and can't accidentally inject any).
 */
export function buildAdminBroadcastEmail(params: {
  subject: string;
  body: string;
  fullName?: string | null;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
}) {
  const greetingName = firstNameOf(params.fullName);
  const greeting = greetingName ? `Hi ${greetingName},` : "Hi there,";
  const paragraphs = params.body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin: 0 0 12px;">${escapeHtml(block).replace(/\n/g, "<br />")}</p>`,
    )
    .join("\n      ");

  const cta =
    params.ctaUrl && params.ctaLabel
      ? ctaButton(params.ctaUrl, params.ctaLabel)
      : "";

  const html = `
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600;">${escapeHtml(params.subject)}</h2>
      <p style="margin: 0 0 12px;">${greeting}</p>
      ${paragraphs}
      ${cta}
    </div>
  `;
  const text = `${params.subject}\n\n${params.body.trim()}${
    params.ctaUrl && params.ctaLabel
      ? `\n\n${params.ctaLabel}: ${params.ctaUrl}`
      : ""
  }`;

  return {
    subject: `${appName}: ${params.subject}`,
    ...withOfficialFooter(html, text),
  };
}
