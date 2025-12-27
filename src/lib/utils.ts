import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInCalendarDays, format } from "date-fns";

export function cn(...inputs: (string | false | null | undefined)[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateRange(start?: string | null, end?: string | null) {
  if (!start || !end) return "Select dates";
  return `${format(new Date(start), "dd MMM")} - ${format(
    new Date(end),
    "dd MMM yyyy",
  )}`;
}

export function calculateNights(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;
  return Math.max(differenceInCalendarDays(new Date(end), new Date(start)), 0);
}

export const carTypes = [
  "SUV",
  "Sedan",
  "Hatchback",
  "Pickup",
  "Luxury",
  "Van",
  "Coupe",
];

export const featureOptions = [
  "Air Conditioning",
  "Automatic",
  "Bluetooth",
  "USB Port",
  "4x4",
  "Leather Seats",
  "Child Seat",
  "Sunroof",
];

export const cities = [
  { city: "Accra", region: "Greater Accra" },
  { city: "Kumasi", region: "Ashanti" },
  { city: "Takoradi", region: "Western" },
  { city: "Tamale", region: "Northern" },
  { city: "Cape Coast", region: "Central" },
  { city: "Tema", region: "Greater Accra" },
];
