import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInCalendarDays, format } from "date-fns";
import { ghanaLocationOptions } from "./ghana-locations";

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

function normalizeLocationToken(value?: string | null) {
  return (value ?? "").toString().trim().toLowerCase().replace(/\s+/g, " ");
}

export function isGreaterAccraRegion(value?: string | null) {
  const normalized = normalizeLocationToken(value);
  if (!normalized) return false;
  return (
    normalized === "greater accra" || normalized === "greater accra region"
  );
}

export function isLocationOutsideAccra(params: {
  region?: string | null;
  city?: string | null;
}) {
  const region = normalizeLocationToken(params.region);
  if (region) {
    return !isGreaterAccraRegion(region);
  }
  const city = normalizeLocationToken(params.city);
  if (!city) return false;
  return city !== "accra" && city !== "tema";
}

export function isOutsideListingRegion(params: {
  tripRegion?: string | null;
  listingRegion?: string | null;
}) {
  const tripRegion = normalizeLocationToken(params.tripRegion);
  const listingRegion = normalizeLocationToken(params.listingRegion);
  if (!tripRegion || !listingRegion) return false;
  return tripRegion !== listingRegion;
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

export const fallbackCities = ghanaLocationOptions;

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
