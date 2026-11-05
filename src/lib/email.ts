import "server-only";
import { Resend } from "resend";
import {
  ANDROID_APK_URL,
  ANDROID_PLAY_STORE_URL,
  IOS_APP_STORE_URL,
} from "@/lib/support";

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
// The white wordmark sits on the blue header band.
const publicSiteUrl = siteUrl.startsWith("https://")
  ? siteUrl.replace(/\/+$/, "")
  : "https://www.hayamegh.com";
const logoUrl =
  process.env.EMAIL_LOGO_URL?.trim() || `${publicSiteUrl}/logo-white.png`;

/**
 * Addresses that receive internal "something happened on the platform"
 * notices (host applications, vehicle submissions, paid bookings, disputes,
 * fee changes). Configure ADMIN_NOTIFICATIONS_EMAIL, comma separated for
 * several inboxes. Falls back to the support inbox.
 */
export function getAdminNotificationRecipients(): string[] {
  const configured = (process.env.ADMIN_NOTIFICATIONS_EMAIL ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (configured.length > 0) return Array.from(new Set(configured));
  return supportEmail ? [supportEmail] : [];
}

type AppLink = { label: string; url: string };

/** App download links for the footer: App Store, then Google Play or the APK hosted on the site. */
function getAppLinks(): AppLink[] {
  const links: AppLink[] = [];
  if (IOS_APP_STORE_URL) {
    links.push({ label: "iPhone (App Store)", url: IOS_APP_STORE_URL });
  }
  if (ANDROID_PLAY_STORE_URL) {
    links.push({ label: "Android (Google Play)", url: ANDROID_PLAY_STORE_URL });
  } else if (ANDROID_APK_URL) {
    const url = ANDROID_APK_URL.startsWith("/")
      ? `${publicSiteUrl}${ANDROID_APK_URL}`
      : ANDROID_APK_URL;
    links.push({ label: "Android (download APK)", url });
  }
  if (links.length === 0) {
    links.push({ label: "Download the app", url: `${publicSiteUrl}/download` });
  }
  return links;
}

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
  const appLinks = getAppLinks();
  const appLinksText = appLinks
    .map((link) => `${link.label} ${link.url}`)
    .join(" | ");
  const appLinksHtml = appLinks
    .map(
      (link) =>
        `<a href="${escapeHtml(link.url)}" style="color:${BRAND}; text-decoration:none; font-weight:600;">${escapeHtml(link.label)}</a>`,
    )
    .join(" &middot; ");
  const footerText = `\n\nThis is an official notification from ${appName}.\nThis email was sent from a no-reply address that is not monitored. Need help? Contact ${supportEmail}.\n${appName} · ${supportAddress}\nGet the ${appName} app: ${appLinksText}\nVisit ${siteUrl}\n`;
  const brandedHtml = `
  <div style="background-color:#f4f6f8; padding: 32px 16px; font-family: ${FONT_STACK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
      <tr>
        <td style="background-color:#ffffff; border:1px solid ${BORDER}; border-radius: 16px; overflow:hidden;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td bgcolor="${BRAND}" style="background-color:${BRAND}; padding: 22px 32px; border-radius: 16px 16px 0 0;">
                <a href="${siteUrl}" style="text-decoration:none; color:#ffffff;">
                  <img src="${logoUrl}" alt="${appName}" width="124" style="display:block; width:124px; max-width:50%; height:auto; border:0; color:#ffffff; font-family: ${FONT_STACK}; font-size: 22px; font-weight: 700;" />
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px; font-family: ${FONT_STACK}; color: ${INK};">
                ${html}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 24px 8px 0; font-family: ${FONT_STACK}; font-size: 12px; line-height: 1.7; color: ${FAINT};">
          This is an official notification from ${appName}.<br />
          Sent from a no-reply address that is not monitored &mdash; need help? <a href="mailto:${supportEmail}" style="color:${BRAND}; text-decoration:none;">${supportEmail}</a><br />
          ${appName} &middot; ${escapeHtml(supportAddress)}<br />
          Get the ${appName} app: ${appLinksHtml}<br />
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
  const hostName = escapeHtml(params.hostName?.trim() || "there");
  const reason = params.reason?.trim() || "No reason provided.";

  if (params.approved) {
    const subject = `${appName}: You're approved to host!`;
    const html = `
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: ${BRAND};">Host application</p>
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600;">Welcome aboard, you're now a verified host</h2>
      <p style="margin: 0 0 12px;">Hi ${hostName},</p>
      <p style="margin: 0 0 12px;">Congratulations! Your identity has been verified and your host application on ${appName} is approved.</p>
      <p style="margin: 0 0 16px;">You can now list your vehicles, set your prices and start receiving booking requests. Every listing goes through a quick review before it appears on the marketplace.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid ${BORDER};">
        ${metaRow("Status", statusPill("confirmed").replace("Confirmed", "Approved"))}
        ${metaRow("Host level", "Verified host")}
      </table>
      ${ctaButton(`${siteUrl}/host/cars/new`, "List your first car")}
      <p style="margin: 12px 0 0; font-size: 13px;">
        <a href="${siteUrl}/host" style="color:${BRAND}; text-decoration:none; font-weight:600;">Host dashboard</a>
        <span style="color:${MUTED};">&middot;</span>
        <a href="${siteUrl}/protection" style="color:${BRAND}; text-decoration:none; font-weight:600;">Host protection</a>
      </p>
    </div>
  `;
    const text = `Welcome aboard, you're now a verified host

Hi ${params.hostName?.trim() || "there"},

Congratulations! Your identity has been verified and your host application on ${appName} is approved.

You can now list your vehicles, set your prices and start receiving booking requests. Every listing goes through a quick review before it appears on the marketplace.

Status: Approved
Host level: Verified host

List your first car: ${siteUrl}/host/cars/new
Host dashboard: ${siteUrl}/host
Host protection: ${siteUrl}/protection`;
    return { subject, ...withOfficialFooter(html, text) };
  }

  const subject = `${appName}: Update on your host application`;
  const html = `
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #b91c1c;">Host application</p>
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600;">We could not approve your application yet</h2>
      <p style="margin: 0 0 12px;">Hi ${hostName},</p>
      <p style="margin: 0 0 12px;">Thank you for your interest in hosting on ${appName}. After reviewing your application, we are unable to approve it at this time.</p>
      <p style="margin: 0 0 16px;">You are welcome to review the reason below, update your details and apply again.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid ${BORDER};">
        ${metaRow("Status", statusPill("rejected").replace("Rejected", "Not approved"))}
        ${metaRow("Reason", escapeHtml(reason))}
      </table>
      ${ctaButton(`${siteUrl}/become-host`, "Update and reapply")}
      <p style="margin: 12px 0 0; font-size: 13px; color: ${MUTED};">If you believe this was a mistake, reply to this email and our team will take another look.</p>
    </div>
  `;
  const text = `We could not approve your application yet

Hi ${params.hostName?.trim() || "there"},

Thank you for your interest in hosting on ${appName}. After reviewing your application, we are unable to approve it at this time.

You are welcome to review the reason below, update your details and apply again.

Status: Not approved
Reason: ${reason}

Update and reapply: ${siteUrl}/become-host

If you believe this was a mistake, reply to this email and our team will take another look.`;

  return { subject, ...withOfficialFooter(html, text) };
}

export function buildHostApplicationSubmittedEmail(params: {
  hostName?: string | null;
}) {
  const hostName = escapeHtml(params.hostName?.trim() || "there");
  const subject = `${appName}: We received your host application`;
  const html = `
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: ${BRAND};">Host application</p>
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600;">Your application is under review</h2>
      <p style="margin: 0 0 12px;">Hi ${hostName},</p>
      <p style="margin: 0 0 12px;">Thank you for applying to host on ${appName}. Our team is now verifying the details and identity documents you submitted.</p>
      <p style="margin: 0 0 16px;">Most applications are reviewed within 1 to 2 business days. We will email you the moment a decision is made.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid ${BORDER};">
        ${metaRow("Status", statusPill("awaiting_host").replace("Awaiting host approval", "Pending review"))}
      </table>
      ${ctaButton(`${siteUrl}/become-host`, "View my application")}
      <p style="margin: 12px 0 0; font-size: 13px; color: ${MUTED};">While you wait, prepare clear photos of your vehicle and its documents so you can list it right after approval.</p>
    </div>
  `;
  const text = `Your application is under review

Hi ${params.hostName?.trim() || "there"},

Thank you for applying to host on ${appName}. Our team is now verifying the details and identity documents you submitted.

Most applications are reviewed within 1 to 2 business days. We will email you the moment a decision is made.

Status: Pending review

View my application: ${siteUrl}/become-host

While you wait, prepare clear photos of your vehicle and its documents so you can list it right after approval.`;

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
  carId?: string | null;
  reason?: string | null;
}) {
  const hostName = escapeHtml(params.hostName?.trim() || "there");
  const rawTitle = params.carTitle?.trim() || "your vehicle";
  const carTitle = escapeHtml(rawTitle);
  const carId = params.carId?.trim() || "";
  const viewUrl = carId ? `${siteUrl}/cars/${carId}` : `${siteUrl}/host/cars`;
  const editUrl = carId
    ? `${siteUrl}/host/cars/${carId}/edit`
    : `${siteUrl}/host/cars`;

  if (params.approved) {
    const subject = `${appName}: ${rawTitle} is now live`;
    const html = `
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #15803d;">Vehicle approved</p>
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600;">${carTitle} is live on ${appName}</h2>
      <p style="margin: 0 0 12px;">Hi ${hostName},</p>
      <p style="margin: 0 0 12px;">Your vehicle passed our review and is now visible to guests searching on ${appName}.</p>
      <p style="margin: 0 0 16px;">Keep your calendar up to date and respond quickly to requests to earn more bookings and better reviews.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid ${BORDER};">
        ${metaRow("Vehicle", carTitle)}
        ${metaRow("Status", statusPill("confirmed").replace("Confirmed", "Approved and published"))}
      </table>
      ${ctaButton(viewUrl, "View your listing")}
      <p style="margin: 12px 0 0; font-size: 13px;">
        <a href="${siteUrl}/host/cars" style="color:${BRAND}; text-decoration:none; font-weight:600;">Manage my cars</a>
        <span style="color:${MUTED};">&middot;</span>
        <a href="${siteUrl}/host" style="color:${BRAND}; text-decoration:none; font-weight:600;">Host dashboard</a>
      </p>
    </div>
  `;
    const text = `${rawTitle} is live on ${appName}

Hi ${params.hostName?.trim() || "there"},

Your vehicle passed our review and is now visible to guests searching on ${appName}.

Keep your calendar up to date and respond quickly to requests to earn more bookings and better reviews.

Vehicle: ${rawTitle}
Status: Approved and published

View your listing: ${viewUrl}
Manage my cars: ${siteUrl}/host/cars
Host dashboard: ${siteUrl}/host`;
    return { subject, ...withOfficialFooter(html, text) };
  }

  const reason = params.reason?.trim() || "No reason provided.";
  const subject = `${appName}: Changes needed for ${rawTitle}`;
  const html = `
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #b91c1c;">Vehicle review</p>
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 600;">${carTitle} needs a few changes</h2>
      <p style="margin: 0 0 12px;">Hi ${hostName},</p>
      <p style="margin: 0 0 16px;">We reviewed your vehicle listing and could not approve it as submitted. Please read the note below, update the listing and resubmit it for review.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid ${BORDER};">
        ${metaRow("Vehicle", carTitle)}
        ${metaRow("Status", statusPill("rejected").replace("Rejected", "Not approved"))}
        ${metaRow("Reason", escapeHtml(reason))}
      </table>
      ${ctaButton(editUrl, "Update listing")}
      <p style="margin: 12px 0 0; font-size: 13px; color: ${MUTED};">Listings with clear photos, accurate details and valid documents are approved fastest.</p>
    </div>
  `;
  const text = `${rawTitle} needs a few changes

Hi ${params.hostName?.trim() || "there"},

We reviewed your vehicle listing and could not approve it as submitted. Please read the note below, update the listing and resubmit it for review.

Vehicle: ${rawTitle}
Status: Not approved
Reason: ${reason}

Update listing: ${editUrl}

Listings with clear photos, accurate details and valid documents are approved fastest.`;

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
  const idSource = params.bookingId ?? params.paymentReference ?? "unknown";
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
  const carTitle = params.carTitle
    ? escapeHtml(params.carTitle)
    : "the booking";
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
          params.policyLabel
            ? ` (per the ${params.policyLabel} cancellation policy)`
            : ""
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

/* -------------------------------------------------------------------------- */
/*  Internal (admin) notifications                                            */
/* -------------------------------------------------------------------------- */

/**
 * Sends an internal notice to the configured admin inbox(es). Never throws;
 * failures are logged so they cannot break the user-facing request.
 */
export async function sendAdminNotificationSafe(params: {
  template: { subject: string; html: string; text: string };
  idempotencyKey?: string;
  replyTo?: string | string[];
}) {
  const recipients = getAdminNotificationRecipients();
  if (recipients.length === 0) {
    console.warn("[email] No admin notification recipients configured.", {
      subject: params.template.subject,
    });
    return { skipped: true };
  }
  return sendEmailSafe({
    to: recipients,
    replyTo: params.replyTo,
    subject: params.template.subject,
    html: params.template.html,
    text: params.template.text,
    idempotencyKey: params.idempotencyKey,
  });
}

function maskIdentifier(value?: string | null) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "Not provided";
  if (trimmed.length <= 4) return trimmed;
  return `${"•".repeat(Math.max(trimmed.length - 4, 2))}${trimmed.slice(-4)}`;
}

function shortId(value?: string | null) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "N/A";
  return trimmed.slice(0, 8).toUpperCase();
}

type AdminNoticeInput = {
  subject: string;
  /** Small uppercase label, e.g. "Host verification". */
  eyebrow: string;
  heading: string;
  intro: string;
  /** Free text written by a user (rendered as a quote, escaped). */
  quote?: string | null;
  rows: Array<{ label: string; value: string }>;
  cta: { label: string; url: string };
  links?: Array<{ label: string; url: string }>;
};

function renderAdminNotice(input: AdminNoticeInput) {
  const rows = input.rows.filter((row) => row.value && row.value.trim());
  const quote = input.quote?.trim() || "";
  const links = input.links ?? [];
  const html = `
    <div style="font-family: ${FONT_STACK}; line-height: 1.6; color: ${INK};">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: ${BRAND};">${escapeHtml(input.eyebrow)} <span style="display:inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 999px; background:#fef3c7; color:#92400e; font-size: 11px; letter-spacing: .04em; vertical-align: middle;">Internal notification</span></p>
      <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 600;">${escapeHtml(input.heading)}</h2>
      <p style="margin: 0 0 16px;">${escapeHtml(input.intro)}</p>
      ${
        quote
          ? `<blockquote style="margin: 0 0 16px; padding: 12px 16px; border-left: 4px solid ${BRAND}; background: #f8fafc; border-radius: 0 8px 8px 0; white-space: pre-wrap; word-break: break-word;">${escapeHtml(quote)}</blockquote>`
          : ""
      }
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid ${BORDER};">
        ${rows.map((row) => metaRow(escapeHtml(row.label), escapeHtml(row.value))).join("")}
      </table>
      ${ctaButton(input.cta.url, escapeHtml(input.cta.label))}
      ${
        links.length > 0
          ? `<p style="margin: 12px 0 0; font-size: 13px;">${links
              .map(
                (link) =>
                  `<a href="${escapeHtml(link.url)}" style="color:${BRAND}; text-decoration:none; font-weight:600;">${escapeHtml(link.label)}</a>`,
              )
              .join(` <span style="color:${MUTED};">&middot;</span> `)}</p>`
          : ""
      }
    </div>
  `;
  const textLines = [
    `[INTERNAL NOTIFICATION] ${input.eyebrow.toUpperCase()}`,
    input.heading,
    "",
    input.intro,
    "",
  ];
  if (quote)
    textLines.push(...quote.split("\n").map((line) => `> ${line}`), "");
  textLines.push(...rows.map((row) => `${row.label}: ${row.value}`), "");
  textLines.push(`${input.cta.label}: ${input.cta.url}`);
  textLines.push(...links.map((link) => `${link.label}: ${link.url}`));
  return {
    subject: input.subject,
    ...withOfficialFooter(html, textLines.join("\n")),
  };
}

export function buildAdminHostApplicationEmail(params: {
  applicationId: string;
  applicantName: string;
  applicantEmail?: string | null;
  phone?: string | null;
  region?: string | null;
  city?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  experience?: string | null;
  fleetSize?: number | null;
  note?: string | null;
  hasIdDocuments: boolean;
  submittedAt?: string | null;
}) {
  return renderAdminNotice({
    subject: `[${appName} Admin] New host verification request: ${params.applicantName}`,
    eyebrow: "Host verification",
    heading: `${params.applicantName} applied to become a host`,
    intro:
      "A new host application is waiting for identity verification and approval. Review the submitted ID documents and approve or reject the request from the admin dashboard.",
    quote: params.note,
    rows: [
      { label: "Application ID", value: params.applicationId },
      { label: "Applicant", value: params.applicantName },
      { label: "Email", value: params.applicantEmail ?? "Not available" },
      { label: "Phone", value: params.phone ?? "Not provided" },
      {
        label: "Location",
        value:
          [params.city, params.region].filter(Boolean).join(", ") ||
          "Not provided",
      },
      { label: "ID type", value: params.idType ?? "Not provided" },
      { label: "ID number", value: maskIdentifier(params.idNumber) },
      {
        label: "ID documents",
        value: params.hasIdDocuments ? "Uploaded" : "Missing",
      },
      { label: "Experience", value: params.experience ?? "Not provided" },
      {
        label: "Fleet size",
        value:
          typeof params.fleetSize === "number"
            ? String(params.fleetSize)
            : "Not provided",
      },
      {
        label: "Submitted at",
        value: formatDateTime(params.submittedAt ?? new Date()),
      },
    ],
    cta: {
      label: "Review application",
      url: `${siteUrl}/admin?status=pending`,
    },
  });
}

export function buildAdminListingSubmittedEmail(params: {
  carId: string;
  carTitle?: string | null;
  hostName?: string | null;
  hostEmail?: string | null;
  city?: string | null;
  region?: string | null;
  dailyPrice?: number | null;
  resubmitted?: boolean;
  submittedAt?: string | null;
}) {
  const carTitle = params.carTitle?.trim() || "New listing";
  const hostName = params.hostName?.trim() || "A host";
  return renderAdminNotice({
    subject: `[${appName} Admin] ${params.resubmitted ? "Listing updated" : "New listing"} pending review: ${carTitle}`,
    eyebrow: "Vehicle approval",
    heading: params.resubmitted
      ? `${hostName} updated ${carTitle}`
      : `${hostName} submitted ${carTitle}`,
    intro: params.resubmitted
      ? "The host edited this listing, so it has returned to the review queue and is hidden from guests until approved."
      : "A new vehicle is waiting for review. It stays hidden from guests until it is approved.",
    rows: [
      { label: "Listing ID", value: params.carId },
      { label: "Vehicle", value: carTitle },
      { label: "Host", value: hostName },
      { label: "Host email", value: params.hostEmail ?? "Not available" },
      {
        label: "Location",
        value:
          [params.city, params.region].filter(Boolean).join(", ") ||
          "Not provided",
      },
      {
        label: "Daily price",
        value:
          typeof params.dailyPrice === "number"
            ? formatCurrency(params.dailyPrice)
            : "Not set",
      },
      {
        label: "Submitted at",
        value: formatDateTime(params.submittedAt ?? new Date()),
      },
    ],
    cta: { label: "Review listing", url: `${siteUrl}/admin/platform` },
    links: [
      {
        label: "Preview listing",
        url: `${siteUrl}/admin/cars/${params.carId}/preview`,
      },
    ],
  });
}

/**
 * A host changed a listing that is already approved. The edit is live right
 * away (no re-review), so this is an activity notice, not a review request.
 */
export function buildAdminListingEditedEmail(params: {
  carId: string;
  carTitle?: string | null;
  hostName?: string | null;
  hostEmail?: string | null;
  changes: Array<{ label: string; from: string; to: string }>;
  editedAt?: string | null;
}) {
  const carTitle = params.carTitle?.trim() || "Listing";
  const hostName = params.hostName?.trim() || "A host";
  const changeRows = params.changes.slice(0, 12).map((change) => ({
    label: change.label,
    value: `${change.from} to ${change.to}`,
  }));
  const hiddenCount = Math.max(params.changes.length - changeRows.length, 0);
  return renderAdminNotice({
    subject: `[${appName} Admin] Live listing edited: ${carTitle}`,
    eyebrow: "Listing activity",
    heading: `${hostName} edited ${carTitle}`,
    intro:
      "This listing is already approved, so the changes are live for guests now. Nothing to approve; open the listing if anything looks off.",
    rows: [
      { label: "Listing ID", value: params.carId },
      { label: "Vehicle", value: carTitle },
      { label: "Host", value: hostName },
      { label: "Host email", value: params.hostEmail ?? "Not available" },
      ...(changeRows.length > 0
        ? changeRows
        : [{ label: "Changes", value: "Saved without any field changes" }]),
      ...(hiddenCount > 0
        ? [{ label: "More", value: `${hiddenCount} other field(s) changed` }]
        : []),
      { label: "Edited at", value: formatDateTime(params.editedAt ?? new Date()) },
    ],
    cta: {
      label: "Open listing",
      url: `${siteUrl}/admin/cars/${params.carId}/preview`,
    },
    links: [{ label: "Audit log", url: `${siteUrl}/admin/audit` }],
  });
}

export function buildAdminBookingNoticeEmail(params: {
  bookingId: string;
  status: string;
  instantBook: boolean;
  carTitle?: string | null;
  carId?: string | null;
  renterName?: string | null;
  renterEmail?: string | null;
  renterPhone?: string | null;
  hostName?: string | null;
  hostEmail?: string | null;
  startDate: string;
  endDate: string;
  nights: number;
  subtotal: number;
  platformFee: number;
  totalPrice: number;
  paymentReference?: string | null;
  paidAt?: string | null;
  tripUseLocation?: string | null;
}) {
  const carTitle = params.carTitle?.trim() || "Listing";
  return renderAdminNotice({
    subject: `[${appName} Admin] ${params.instantBook ? "Booking confirmed" : "Booking request"}: ${carTitle} (${formatCurrency(params.totalPrice)})`,
    eyebrow: "Paid booking",
    heading: params.instantBook
      ? `New confirmed booking for ${carTitle}`
      : `New booking request for ${carTitle}`,
    intro: params.instantBook
      ? "Payment was captured and the booking auto-confirmed (instant book)."
      : "Payment was captured and the host has been asked to approve the request.",
    rows: [
      { label: "Booking ID", value: params.bookingId },
      { label: "Status", value: params.status.replace(/_/g, " ") },
      { label: "Guest", value: params.renterName?.trim() || "Guest" },
      { label: "Guest email", value: params.renterEmail ?? "Not available" },
      { label: "Guest phone", value: params.renterPhone ?? "Not provided" },
      { label: "Host", value: params.hostName?.trim() || "Host" },
      { label: "Host email", value: params.hostEmail ?? "Not available" },
      {
        label: "Trip dates",
        value: `${params.startDate} to ${params.endDate}`,
      },
      { label: "Nights", value: String(params.nights) },
      ...(params.tripUseLocation
        ? [{ label: "Trip use location", value: params.tripUseLocation }]
        : []),
      { label: "Subtotal", value: formatCurrency(params.subtotal) },
      {
        label: "Platform fee earned",
        value: formatCurrency(params.platformFee),
      },
      { label: "Total paid", value: formatCurrency(params.totalPrice) },
      { label: "Payment reference", value: params.paymentReference ?? "N/A" },
      { label: "Paid at", value: formatDateTime(params.paidAt) },
    ],
    cta: { label: "Open platform controls", url: `${siteUrl}/admin/platform` },
    links: params.carId
      ? [{ label: "View listing", url: `${siteUrl}/cars/${params.carId}` }]
      : undefined,
  });
}

export function buildAdminDisputeOpenedEmail(params: {
  disputeId: string;
  bookingId: string;
  carTitle?: string | null;
  openedByName?: string | null;
  openedByEmail?: string | null;
  openedByRole: "renter" | "host";
  reason: string;
  openedAt?: string | null;
}) {
  const carTitle = params.carTitle?.trim() || "Listing";
  return renderAdminNotice({
    subject: `[${appName} Admin] Dispute opened on ${carTitle}`,
    eyebrow: "Dispute",
    heading: `A ${params.openedByRole} opened a dispute`,
    intro: `${params.openedByName?.trim() || "A user"} opened a dispute on booking ${shortId(params.bookingId)} for ${carTitle}. Please review and respond from the platform controls.`,
    quote: params.reason,
    rows: [
      { label: "Dispute ID", value: params.disputeId },
      { label: "Booking ID", value: params.bookingId },
      { label: "Listing", value: carTitle },
      { label: "Opened by", value: params.openedByName?.trim() || "Unknown" },
      { label: "Contact", value: params.openedByEmail ?? "Not available" },
      { label: "Role", value: params.openedByRole },
      {
        label: "Opened at",
        value: formatDateTime(params.openedAt ?? new Date()),
      },
    ],
    cta: { label: "Review dispute", url: `${siteUrl}/admin/platform` },
  });
}

export function buildAdminPlatformSettingsChangedEmail(params: {
  changedBy: string;
  previousFeePercent: number | null;
  nextFeePercent: number;
  changedAt?: string | null;
}) {
  return renderAdminNotice({
    subject: `[${appName} Admin] Platform fee changed to ${params.nextFeePercent}%`,
    eyebrow: "Platform settings",
    heading: "The platform fee was updated",
    intro:
      "The platform fee applied to new bookings has been changed. Existing bookings keep the fee they were charged at the time of payment.",
    rows: [
      {
        label: "Previous fee",
        value:
          params.previousFeePercent === null
            ? "Not set"
            : `${params.previousFeePercent}%`,
      },
      { label: "New fee", value: `${params.nextFeePercent}%` },
      { label: "Changed by", value: params.changedBy },
      {
        label: "Changed at",
        value: formatDateTime(params.changedAt ?? new Date()),
      },
    ],
    cta: { label: "Open platform controls", url: `${siteUrl}/admin/platform` },
  });
}

export function buildAdminActivityEmail(params: {
  severity: "important" | "critical";
  actionLabel: string;
  summary: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  ip?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
}) {
  const detailRows = Object.entries(params.details ?? {})
    .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
    .slice(0, 6)
    .map(([key, value]) => ({
      label: key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
      value: String(value).slice(0, 200),
    }));
  return renderAdminNotice({
    subject: `[${appName} Admin${params.severity === "critical" ? " · CRITICAL" : ""}] ${params.actionLabel}`,
    eyebrow: params.severity === "critical" ? "Critical admin action" : "Admin activity",
    heading: params.summary,
    intro:
      "This was done in the admin portal. If it wasn't expected, open the audit log and contact a super admin right away.",
    rows: [
      { label: "Action", value: params.actionLabel },
      {
        label: "Done by",
        value: params.actorEmail
          ? `${params.actorName} (${params.actorEmail})${params.actorRole ? `, ${params.actorRole}` : ""}`
          : params.actorName,
      },
      {
        label: "Target",
        value: params.targetType
          ? `${params.targetType}${params.targetId ? ` ${shortId(params.targetId)}` : ""}`
          : "",
      },
      ...detailRows,
      { label: "IP address", value: params.ip ?? "" },
      { label: "When", value: formatDateTime(new Date()) },
    ],
    cta: { label: "Open the audit log", url: `${siteUrl}/admin/audit` },
  });
}

export function buildAdminWelcomeEmail(params: {
  name: string;
  email: string;
  roleLabel: string;
  roleDescription: string;
  createdBy: string;
}) {
  return renderAdminNotice({
    subject: `[${appName} Admin] Your admin account is ready`,
    eyebrow: "Admin access",
    heading: `Welcome, ${params.name}`,
    intro: `${params.createdBy} gave you access to the ${appName} admin portal. Your temporary password was shared with you separately. You will be asked to choose your own password the first time you sign in. Every action you take is logged.`,
    rows: [
      { label: "Sign in with", value: params.email },
      { label: "Your role", value: params.roleLabel },
      { label: "What it allows", value: params.roleDescription },
    ],
    cta: { label: "Open the admin portal", url: `${siteUrl}/admin` },
  });
}
