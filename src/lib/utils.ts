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

export function getInitials(name?: string | null) {
  if (!name) return "";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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

export const fuelTypes = ["petrol", "diesel", "electric", "lpg", "hybrid"];

export const fallbackCities = [
  { city: "Accra", region: "Greater Accra" },
  { city: "Kumasi", region: "Ashanti" },
  { city: "Takoradi", region: "Western" },
  { city: "Tamale", region: "Northern" },
  { city: "Cape Coast", region: "Central" },
  { city: "Tema", region: "Greater Accra" },
];

export const featureOptions = [
  "Air Conditioning",
  "Airbags",
  "Alloy Wheels",
  "AM/FM Radio",
  "Electric Windows",
  "Android Auto",
  "Anti-Lock Brakes",
  "Armrests",
  "Blind Spot Monitor",
  "Bullbar",
  "Apple CarPlay",
  "CD Player",
  "Cruise Control",
  "Cup Holders",
  "Electric Mirrors",
  "Front Fog Lamps",
  "Leather Seats",
  "LED Headlights",
  "Parking Assist",
  "Parking Sensors",
  "Reverse Camera",
  "Roof Rack",
  "Sidesteps",
  "Spotlight",
  "Sunroof",
  "Traction Control",
  "Winch",
  "Xenon Lights",
  // legacy options kept for backwards compatibility
  "Automatic",
  "Bluetooth",
  "GPS",
  "USB Port",
  "4x4",
  "Child Seat",
];

export const cities = fallbackCities;
