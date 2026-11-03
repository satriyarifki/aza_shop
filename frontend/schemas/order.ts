import { z } from "zod";

const orderItemSchema = z.object({
  product_id: z.number("Select a product").int().positive("Select a product"),
  quantity: z
    .number("Enter a quantity")
    .int("Quantity must be a whole number")
    .positive("Quantity must be at least 1"),
});

// Only IDs and quantities are sent; prices and totals are always calculated by the backend
export const orderFormSchema = z
  .object({
    customer_id: z.number("Select a customer").int().positive("Select a customer"),
    items: z.array(orderItemSchema).min(1, "Add at least one product"),
  })
  .superRefine((order, ctx) => {
    const seenProductIds = new Set<number>();

    order.items.forEach((item, index) => {
      if (seenProductIds.has(item.product_id)) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "product_id"],
          message: "This product is already in the order",
        });
      }
      seenProductIds.add(item.product_id);
    });
  });

export type OrderInput = z.output<typeof orderFormSchema>;
