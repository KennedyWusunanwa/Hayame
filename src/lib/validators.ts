import { z } from "zod";
import { featureOptions } from "./utils";

export const carFormSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  daily_price: z.coerce.number().min(50),
  city: z.string().min(2),
  region: z.string().min(2),
  car_type: z.string().optional(),
  seats: z.coerce.number().min(2).max(8).optional(),
  transmission: z.string().optional(),
  fuel: z.string().optional(),
  features: z.array(z.string().refine((f) => featureOptions.includes(f))).optional(),
  is_available: z.boolean().optional(),
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

export const availabilitySchema = z.object({
  carId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  available: z.boolean().optional(),
  repeatDays: z.array(z.string()).optional(),
});

export const hostApplicationSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().min(6).optional(),
  city: z.string().min(2).optional(),
  experience: z.string().min(10),
  fleet_size: z.coerce.number().int().min(0).max(1000).optional(),
  message: z.string().optional(),
});
