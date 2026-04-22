export type DisplayStatus =
  | "pending"
  | "confirmed"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "rejected"
  | "refunded";

type BookingStatusInput = {
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  payment_status?: string | null;
};

export function getDisplayStatus(booking: BookingStatusInput): DisplayStatus {
  const raw = String(booking.status ?? "").toLowerCase();
  if (raw === "completed") return "completed";
  if (raw === "cancelled") return "cancelled";
  if (raw === "rejected") return "rejected";
  if (raw === "refunded") return "refunded";
  if (raw === "confirmed") {
    const start = safeDate(booking.start_date);
    const end = safeDate(booking.end_date);
    const now = new Date();
    if (end && now >= end) return "completed";
    if (start && end && now >= start && now < end) return "ongoing";
    return "confirmed";
  }
  return "pending";
}

export function shouldShowCompletedPaidBadge(
  booking: BookingStatusInput,
  status = getDisplayStatus(booking),
) {
  return (
    status === "completed" &&
    String(booking.payment_status ?? "").toLowerCase() === "paid"
  );
}

export function getStatusLabel(status: DisplayStatus) {
  switch (status) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "ongoing":
      return "Ongoing";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "rejected":
      return "Rejected";
    case "refunded":
      return "Refunded";
  }
}

export function getStatusClasses(status: DisplayStatus) {
  switch (status) {
    case "pending":
      return "inline-flex w-fit items-center rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800";
    case "confirmed":
      return "inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800";
    case "ongoing":
      return "inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800";
    case "completed":
      return "inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700";
    case "cancelled":
    case "rejected":
    case "refunded":
      return "inline-flex w-fit items-center rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700";
  }
}

export function getBookingHelperText(
  status: DisplayStatus,
  mode: "guest" | "host",
  paymentStatus?: string | null,
) {
  switch (status) {
    case "pending":
      if (mode === "host") {
        return String(paymentStatus ?? "").toLowerCase() === "paid"
          ? "Review this request and decide what happens next."
          : "Waiting for renter payment before approval.";
      }
      return "Waiting for host confirmation.";
    case "confirmed":
      return mode === "host"
        ? "Booking confirmed. Prepare for handoff."
        : "Your trip is confirmed. Get ready.";
    case "ongoing":
      return mode === "host"
        ? "Trip is in progress."
        : "Your trip is in progress.";
    case "completed":
      return "Trip completed successfully.";
    case "cancelled":
      return "This booking was cancelled.";
    case "rejected":
      return "This booking was rejected.";
    case "refunded":
      return "This booking was refunded.";
  }
}

function safeDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}
