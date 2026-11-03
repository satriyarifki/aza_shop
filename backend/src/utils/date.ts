import { env } from "../config/env.js";

const businessTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: env.APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

// Wall-clock date and time of an instant in the business timezone
function getBusinessTimeParts(instant: Date) {
  const parts = businessTimeFormatter.formatToParts(instant);
  const valueOf = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    year: valueOf("year"),
    month: valueOf("month"),
    day: valueOf("day"),
    hour: valueOf("hour"),
    minute: valueOf("minute"),
    second: valueOf("second"),
  };
}

// Returns the calendar date ("YYYY-MM-DD") of an instant in the business timezone
export function toBusinessDate(instant: Date) {
  const { year, month, day } = getBusinessTimeParts(instant);
  return `${year}-${month}-${day}`;
}

export function isValidCalendarDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function addDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

// The UTC instant at which a business calendar date ("YYYY-MM-DD") begins,
// e.g. 2026-11-03 in Asia/Jakarta starts at 2026-11-02T17:00:00.000Z
export function startOfBusinessDay(date: string) {
  const utcMidnight = new Date(`${date}T00:00:00Z`);
  const wallTime = getBusinessTimeParts(utcMidnight);
  const wallTimeAsUtc = Date.UTC(
    Number(wallTime.year),
    Number(wallTime.month) - 1,
    Number(wallTime.day),
    Number(wallTime.hour),
    Number(wallTime.minute),
    Number(wallTime.second),
  );
  const timezoneOffsetMs = wallTimeAsUtc - utcMidnight.getTime();

  return new Date(utcMidnight.getTime() - timezoneOffsetMs);
}
