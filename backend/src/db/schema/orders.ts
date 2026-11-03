import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  check,
  index,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { customers } from "./customers.js";
import { users } from "./users.js";

export const orderStatusEnum = pgEnum("order_status", ["PENDING", "PAID", "CANCELLED"]);

export const orders = pgTable(
  "orders",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    orderNumber: varchar("order_number", { length: 30 }).notNull().unique(),
    customerId: bigint("customer_id", { mode: "number" })
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    subtotal: bigint("subtotal", { mode: "bigint" }).notNull(),
    discountAmount: bigint("discount_amount", { mode: "bigint" }).notNull().default(sql`0`),
    grandTotal: bigint("grand_total", { mode: "bigint" }).notNull(),
    status: orderStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("orders_customer_id_idx").on(table.customerId),
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt),

    check("orders_subtotal_non_negative", sql`${table.subtotal} >= 0`),
    check("orders_discount_non_negative", sql`${table.discountAmount} >= 0`),
    check("orders_discount_within_subtotal", sql`${table.discountAmount} <= ${table.subtotal}`),
    check("orders_discount_max", sql`${table.discountAmount} <= 150000`),
    check("orders_grand_total_non_negative", sql`${table.grandTotal} >= 0`),
    check(
      "orders_grand_total_matches",
      sql`${table.grandTotal} = ${table.subtotal} - ${table.discountAmount}`,
    ),
  ],
);
