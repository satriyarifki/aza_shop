import { env } from "../config/env.js";

// Returns the calendar date ("YYYY-MM-DD") of an instant in the business timezone
export function toBusinessDate(instant: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: env.APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const valueOf = (type: string) => parts.find((part) => part.type === type)?.value;

  return `${valueOf("year")}-${valueOf("month")}-${valueOf("day")}`;
}
