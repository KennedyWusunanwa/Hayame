import { z } from "zod";

export const contactRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name.")
    .max(80, "Name is too long."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(120, "Email is too long."),
  phone: z
    .string()
    .trim()
    .max(40, "Phone number is too long.")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Please add a bit more detail.")
    .max(3000, "Message is too long."),
  company: z.string().trim().max(120).optional().or(z.literal("")),
});

export type ContactRequestInput = z.infer<typeof contactRequestSchema>;

export function isContactSpamTrapTriggered(
  input: Pick<ContactRequestInput, "company">,
) {
  return Boolean(input.company?.trim());
}
