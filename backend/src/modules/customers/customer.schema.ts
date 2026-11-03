import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination.js";

// Forms usually send "" for optional fields left blank; store those as NULL
const emptyToNull = (value: string) => (value === "" ? null : value);

export const listCustomersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(100).optional(),
});

export const createCustomerSchema = z
  .object({
    name: z
      .string("Name is required")
      .trim()
      .min(1, "Name is required")
      .max(150, "Name must not exceed 150 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(150, "Email must not exceed 150 characters")
      .refine((value) => value === "" || z.email().safeParse(value).success, "Invalid email address")
      .transform(emptyToNull)
      .nullish(),
    phone: z
      .string()
      .trim()
      .regex(/^(\+?[0-9][0-9\s-]{5,28})?$/, "Phone may only contain digits, spaces, dashes and a leading +")
      .transform(emptyToNull)
      .nullish(),
    address: z.string().trim().max(1000, "Address must not exceed 1000 characters").transform(emptyToNull).nullish(),
  })
  .strict();

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
