import { z } from "zod";

const POSTGRES_INTEGER_MAX = 2_147_483_647;
const MAX_ITEMS_PER_ORDER = 100;

const positiveId = (label: string) =>
  z
    .number(`${label} must be a number`)
    .int(`${label} must be an integer`)
    .positive(`${label} must be a positive integer`);

// Only product IDs and quantities are accepted; prices and totals are always calculated by the backend
const orderItemSchema = z
  .object({
    product_id: positiveId("Product ID"),
    quantity: z
      .number("Quantity must be a number")
      .int("Quantity must be an integer")
      .positive("Quantity must be greater than 0")
      .max(POSTGRES_INTEGER_MAX, "Quantity is too large"),
  })
  .strict();

export const createOrderSchema = z
  .object({
    customer_id: positiveId("Customer ID"),
    items: z
      .array(orderItemSchema, "Items must be an array")
      .min(1, "Order must contain at least one item")
      .max(MAX_ITEMS_PER_ORDER, `Order must not contain more than ${MAX_ITEMS_PER_ORDER} items`),
  })
  .strict()
  .superRefine((order, ctx) => {
    const seenProductIds = new Set<number>();

    order.items.forEach((item, index) => {
      if (seenProductIds.has(item.product_id)) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "product_id"],
          message: "Each product may only appear once in an order",
        });
      }
      seenProductIds.add(item.product_id);
    });
  });

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
