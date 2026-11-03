import { sql } from "drizzle-orm";
import { check, date, integer, pgTable } from "drizzle-orm/pg-core";

// One counter row per business date, incremented atomically when an order is created
export const invoiceSequences = pgTable(
  "invoice_sequences",
  {
    invoiceDate: date("invoice_date", { mode: "string" }).primaryKey(),
    lastNumber: integer("last_number").notNull(),
  },
  (table) => [check("invoice_sequences_last_number_positive", sql`${table.lastNumber} > 0`)],
);
