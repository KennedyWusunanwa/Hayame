import { z } from "zod";
import { featureOptions, fuelTypes } from "./utils";

export const carFormSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  daily_price: z.coerce.number().min(50),
  city: z.string().min(2),
  region: z.string().min(2),
  car_type: z.string().optional(),
  seats: z.coerce.number().min(2).max(8).optional(),
  transmission: z.string().optional(),
  fuel_type: z.enum(fuelTypes as [string, ...string[]]).optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  car_year: z.coerce.number().int().min(2000).max(new Date().getFullYear() + 1).optional(),
  features: z.array(z.string().refine((f) => featureOptions.includes(f))).optional(),
  is_available: z.boolean().optional(),
  instant_book: z.boolean().optional(),
  delivery_available: z.boolean().optional(),
  air_conditioning: z.boolean().optional(),
  delivery_fee: z.coerce.number().min(0).optional(),
  insurance_fee: z.coerce.number().min(0).optional(),
  deposit_amount: z.coerce.number().min(0).optional(),
  cancellation_policy: z.enum(["flexible", "moderate", "strict"]).optional(),
});

export const bookingSchema = z.object({
  carId: z.string().uuid().or(z.string()),
  startDate: z.string(),
  endDate: z.string(),
});

export const favoriteSchema = z.object({
  carId: z.string(),
  isFavorite: z.boolean(),
});

export const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const disputeSchema = z.object({
  bookingId: z.string().uuid().or(z.string()),
  reason: z.string().min(5),
});

export const availabilitySchema = z.object({
  carId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  available: z.boolean().optional(),
  repeatDays: z.array(z.string()).optional(),
});

export const hostApplicationSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(6),
  region: z.string().min(2),
  city: z.string().min(2),
  id_type: z.enum(["Ghana Card", "NHIS", "Voters ID", "Driving Licence"]),
  id_number: z.string().min(4),
  id_front_path: z.string().min(4),
  id_back_path: z.string().min(4),
  note: z.string().optional(),
  experience: z.string().min(10),
  fleet_size: z.coerce.number().int().min(0).max(1000).optional(),
});
