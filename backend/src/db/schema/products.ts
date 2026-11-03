import { sql } from "drizzle-orm";
import { bigint, bigserial, check, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const products = pgTable(
  "products",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    productCode: varchar("product_code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 150 }).notNull(),
    price: bigint("price", { mode: "bigint" }).notNull(),
    stock: integer("stock").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check("products_price_positive", sql`${table.price} > 0`),
    check("products_stock_non_negative", sql`${table.stock} >= 0`),
  ],
);
