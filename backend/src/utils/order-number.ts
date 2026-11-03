import { sql } from "drizzle-orm";
import type { Transaction } from "../db/index.js";
import { invoiceSequences } from "../db/schema/index.js";
import { toBusinessDate } from "./date.js";

/**
 * Generates the next order number for the business date, e.g. INV-20261103-0001.
 *
 * The upsert increments the date's counter in a single statement and keeps the row locked
 * until the surrounding transaction ends, so concurrent orders always get different numbers.
 * If the order transaction rolls back, the increment rolls back too and the number is reused.
 */
export async function generateOrderNumber(tx: Transaction, createdAt = new Date()) {
  const invoiceDate = toBusinessDate(createdAt);

  const [sequence] = await tx
    .insert(invoiceSequences)
    .values({ invoiceDate, lastNumber: 1 })
    .onConflictDoUpdate({
      target: invoiceSequences.invoiceDate,
      set: { lastNumber: sql`${invoiceSequences.lastNumber} + 1` },
    })
    .returning({ lastNumber: invoiceSequences.lastNumber });

  const datePart = invoiceDate.replaceAll("-", "");
  const sequencePart = String(sequence!.lastNumber).padStart(4, "0");

  return `INV-${datePart}-${sequencePart}`;
}
