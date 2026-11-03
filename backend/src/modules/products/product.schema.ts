import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination.js";

const POSTGRES_BIGINT_MAX = 9_223_372_036_854_775_807n;
const POSTGRES_INTEGER_MAX = 2_147_483_647;

// Prices arrive as integer strings so large Rupiah values never pass through a JS Number
const priceSchema = z
  .string("Price must be an integer string")
  .trim()
  .regex(/^\d+$/, "Price must be an integer string, e.g. \"150000\"")
  .transform((value) => BigInt(value))
  .refine((price) => price > 0n, "Price must be greater than 0")
  .refine((price) => price <= POSTGRES_BIGINT_MAX, "Price is too large");

export const productIdParamSchema = z.object({
  id: z.coerce
    .number("Product ID must be a number")
    .int("Product ID must be an integer")
    .positive("Product ID must be a positive integer"),
});

export const listProductsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(100).optional(),
});

export const productBodySchema = z
  .object({
    product_code: z
      .string("Product code is required")
      .trim()
      .min(1, "Product code is required")
      .max(50, "Product code must not exceed 50 characters"),
    name: z
      .string("Name is required")
      .trim()
      .min(1, "Name is required")
      .max(150, "Name must not exceed 150 characters"),
    price: priceSchema,
    stock: z
      .number("Stock must be a number")
      .int("Stock must be an integer")
      .min(0, "Stock must not be negative")
      .max(POSTGRES_INTEGER_MAX, "Stock is too large"),
  })
  .strict();

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type ProductBody = z.infer<typeof productBodySchema>;
