import { format, parse } from "date-fns";

type DeliveryInput = {
  deliveryAddress?: string | null;
  deliveryTime?: string | null;
  contactPhone?: string | null;
  deliveryNotes?: string | null;
};

export type BookingTripMode = "pickup" | "delivery";

export function normalizeBookingDelivery(input: DeliveryInput) {
  return {
    deliveryAddress: normalizeText(input.deliveryAddress),
    deliveryTime: normalizeText(input.deliveryTime),
    contactPhone: normalizeText(input.contactPhone),
    deliveryNotes: normalizeText(input.deliveryNotes),
  };
}

export function hasBookingDeliveryDetails(input: DeliveryInput) {
  const details = normalizeBookingDelivery(input);
  return Boolean(
    details.deliveryAddress ||
      details.deliveryTime ||
      details.contactPhone ||
      details.deliveryNotes,
  );
}

export function normalizeBookingTripMode(
  value?: string | null,
): BookingTripMode | null {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "pickup" || normalized === "delivery") {
    return normalized;
  }
  return null;
}

export function resolveBookingTripMode(
  input: DeliveryInput & {
    tripMode?: string | null;
    deliveryAvailable?: boolean | null;
    deliveryFee?: number | string | null;
  },
): BookingTripMode {
  const explicitMode = normalizeBookingTripMode(input.tripMode);
  if (explicitMode === "pickup") return "pickup";
  if (explicitMode === "delivery") {
    return input.deliveryAvailable === false ? "pickup" : "delivery";
  }
  if (hasBookingDeliveryDetails(input)) {
    return input.deliveryAvailable === false ? "pickup" : "delivery";
  }

  const normalizedDeliveryFee = Math.max(Number(input.deliveryFee ?? 0), 0);
  return input.deliveryAvailable !== false && normalizedDeliveryFee > 0
    ? "delivery"
    : "pickup";
}

export function validateBookingDelivery(
  input: DeliveryInput,
  options: { required?: boolean } = {},
) {
  const details = normalizeBookingDelivery(input);
  const shouldValidate =
    options.required === true || hasBookingDeliveryDetails(details);

  if (!shouldValidate) return null;
  if (details.deliveryAddress.length < 6) {
    return "Enter the exact delivery address.";
  }
  if (!isValidDeliveryTime(details.deliveryTime)) {
    return "Select a delivery time.";
  }
  if (!hasValidPhone(details.contactPhone)) {
    return "Enter a valid contact phone number.";
  }
  if (details.deliveryNotes.length > 500) {
    return "Delivery notes must be 500 characters or fewer.";
  }
  return null;
}

export function toNullableBookingDelivery(input: DeliveryInput) {
  const details = normalizeBookingDelivery(input);
  return {
    delivery_address: details.deliveryAddress || null,
    delivery_time: details.deliveryTime || null,
    contact_phone: details.contactPhone || null,
    delivery_notes: details.deliveryNotes || null,
  };
}

export function buildMapsSearchUrl(address?: string | null) {
  const normalized = normalizeText(address);
  if (!normalized) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(normalized)}`;
}

export function buildTelephoneUrl(phone?: string | null) {
  const normalized = normalizeText(phone);
  if (!normalized) return null;
  const dialable = normalized.replace(/[^\d+]/g, "");
  return dialable ? `tel:${dialable}` : null;
}

export function formatDeliveryTimeLabel(time?: string | null) {
  const normalized = normalizeText(time);
  if (!isValidDeliveryTime(normalized)) return "Not provided";
  try {
    return format(parse(normalized, "HH:mm", new Date()), "h:mm a");
  } catch {
    return normalized;
  }
}

export function hasValidPhone(value?: string | null) {
  const digits = normalizeText(value).replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function isValidDeliveryTime(value?: string | null) {
  return /^\d{2}:\d{2}$/.test(normalizeText(value));
}

function normalizeText(value?: string | null) {
  return String(value ?? "").trim();
}
