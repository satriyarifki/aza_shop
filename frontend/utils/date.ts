// Dates are shown in the business timezone, matching invoice numbers and order filters
const BUSINESS_TIMEZONE = "Asia/Jakarta";

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: BUSINESS_TIMEZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(isoString: string) {
  return dateTimeFormatter.format(new Date(isoString));
}
