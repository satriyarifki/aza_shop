import { bigserial, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 150 }),
  phone: varchar("phone", { length: 30 }),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
