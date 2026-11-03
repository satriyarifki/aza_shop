import { z } from "zod";

const POSTGRES_BIGINT_MAX = 9_223_372_036_854_775_807n;
const POSTGRES_INTEGER_MAX = 2_147_483_647;

// Form inputs are strings. Thousand separators ("1.500.000") are allowed and stripped.
export const productFormSchema = z.object({
  product_code: z
    .string()
    .trim()
    .min(1, "Product code is required")
    .max(50, "Product code must not exceed 50 characters"),
  name: z.string().trim().min(1, "Name is required").max(150, "Name must not exceed 150 characters"),
  price: z
    .string()
    .transform((value) => value.replace(/[.\s]/g, ""))
    .pipe(
      z
        .string()
        .regex(/^\d+$/, { message: "Price must be a whole number of Rupiah", abort: true })
        .refine((value) => BigInt(value) > 0n, "Price must be greater than 0")
        .refine((value) => BigInt(value) <= POSTGRES_BIGINT_MAX, "Price is too large"),
    ),
  stock: z
    .string()
    .trim()
    .regex(/^\d+$/, { message: "Stock must be a whole number (0 or more)", abort: true })
    .transform(Number)
    .refine((value) => value <= POSTGRES_INTEGER_MAX, "Stock is too large"),
});

export type ProductInput = z.output<typeof productFormSchema>;
