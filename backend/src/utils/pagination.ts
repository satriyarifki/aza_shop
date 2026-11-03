import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number("Page must be a number")
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .default(1),
  limit: z.coerce
    .number("Limit must be a number")
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .default(10),
});

export function getOffset(page: number, limit: number) {
  return (page - 1) * limit;
}
