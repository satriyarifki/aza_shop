import { z } from "zod";
import { orderStatusEnum } from "../../db/schema/index.js";
import { isValidCalendarDate } from "../../utils/date.js";
import { paginationQuerySchema } from "../../utils/pagination.js";

const POSTGRES_INTEGER_MAX = 2_147_483_647;
const MAX_ITEMS_PER_ORDER = 100;

const positiveId = (label: string) =>
  z
    .number(`${label} must be a number`)
    .int(`${label} must be an integer`)
    .positive(`${label} must be a positive integer`);

export const orderIdParamSchema = z.object({
  id: z.coerce
    .number("Order ID must be a number")
    .int("Order ID must be an integer")
    .positive("Order ID must be a positive integer"),
});

// Calendar dates in the business timezone (Asia/Jakarta), e.g. "2026-11-03"
const businessDateSchema = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: `${label} must use the YYYY-MM-DD format`, abort: true })
    .refine(isValidCalendarDate, `${label} is not a valid calendar date`);

export const listOrdersQuerySchema = paginationQuerySchema
  .extend({
    status: z
      .enum(orderStatusEnum.enumValues, `Status must be one of ${orderStatusEnum.enumValues.join(", ")}`)
      .optional(),
    start_date: businessDateSchema("Start date").optional(),
    end_date: businessDateSchema("End date").optional(),
  })
  .refine((query) => !query.start_date || !query.end_date || query.start_date <= query.end_date, {
    path: ["start_date"],
    message: "Start date must not be after end date",
  });

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

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
