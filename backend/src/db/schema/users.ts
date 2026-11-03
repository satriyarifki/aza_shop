import { bigserial, pgEnum, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["ADMIN"]);

export const users = pgTable("users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("ADMIN"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
