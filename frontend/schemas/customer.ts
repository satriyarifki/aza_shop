import { z } from "zod";

// Optional fields may stay empty; the backend stores empty values as NULL
export const customerFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Name must not exceed 150 characters"),
  email: z
    .string()
    .trim()
    .max(150, "Email must not exceed 150 characters")
    .refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[0-9][0-9\s-]{5,28})?$/, "Use digits, spaces, dashes and an optional leading +"),
  address: z.string().trim().max(1000, "Address must not exceed 1000 characters"),
});

export type CustomerInput = z.output<typeof customerFormSchema>;
