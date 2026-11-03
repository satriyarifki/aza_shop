import { sql } from "drizzle-orm";
import { bigint, bigserial, check, index, integer, pgTable, unique } from "drizzle-orm/pg-core";
import { orders } from "./orders.js";
import { products } from "./products.js";

export const orderItems = pgTable(
  "order_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    orderId: bigint("order_id", { mode: "number" })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: bigint("product_id", { mode: "number" })
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    unitPrice: bigint("unit_price", { mode: "bigint" }).notNull(),
    subtotal: bigint("subtotal", { mode: "bigint" }).notNull(),
  },
  (table) => [
    unique("order_items_order_product_unique").on(table.orderId, table.productId),
    index("order_items_product_id_idx").on(table.productId),

    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check("order_items_unit_price_positive", sql`${table.unitPrice} > 0`),
    check("order_items_subtotal_non_negative", sql`${table.subtotal} >= 0`),
    check(
      "order_items_subtotal_matches",
      sql`${table.subtotal} = ${table.unitPrice} * ${table.quantity}`,
    ),
  ],
);
