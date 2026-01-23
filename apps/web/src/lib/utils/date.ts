import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

// Get timezone from environment variable (default: Asia/Tokyo for JST)
const TZ = import.meta.env.VITE_TIMEZONE || "Asia/Tokyo";

/**
 * Format a date string in the configured timezone
 *
 * @param dateString - ISO 8601 date string (UTC)
 * @param format - dayjs format string (default: "YYYY-MM-DD HH:mm:ss")
 * @returns Formatted date string in the configured timezone
 *
 * @example
 * formatDate("2026-01-23T10:30:00.000Z")
 * // => "2026-01-23 19:30:00" (JST, UTC+9)
 */
export function formatDate(
  dateString: string,
  format: string = "YYYY-MM-DD HH:mm:ss",
): string {
  return dayjs(dateString).tz(TZ).format(format);
}

/**
 * Format a date string with localized format
 *
 * @param dateString - ISO 8601 date string (UTC)
 * @returns Formatted date string like "Jan 23, 2026 at 7:30 PM"
 *
 * @example
 * formatDateLocale("2026-01-23T10:30:00.000Z")
 * // => "Jan 23, 2026 at 7:30 PM" (JST)
 */
export function formatDateLocale(dateString: string): string {
  const date = dayjs(dateString).tz(TZ);
  return date.format("MMM D, YYYY [at] h:mm A");
}

/**
 * Format a date string with full details including timezone
 *
 * @param dateString - ISO 8601 date string (UTC)
 * @returns Formatted date string with timezone
 *
 * @example
 * formatDateWithTZ("2026-01-23T10:30:00.000Z")
 * // => "2026-01-23 19:30:00 JST"
 */
export function formatDateWithTZ(dateString: string): string {
  const date = dayjs(dateString).tz(TZ);
  const formatted = date.format("YYYY-MM-DD HH:mm:ss");
  const tzAbbr = date.format("z");
  return `${formatted} ${tzAbbr}`;
}

/**
 * Format a date string for compact display
 *
 * @param dateString - ISO 8601 date string (UTC)
 * @returns Formatted date string like "Jan 23, 19:30"
 */
export function formatDateCompact(dateString: string): string {
  return dayjs(dateString).tz(TZ).format("MMM D, HH:mm");
}

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 *
 * @param dateString - ISO 8601 date string (UTC)
 * @returns Relative time string
 *
 * @example
 * getRelativeTime("2026-01-23T10:30:00.000Z")
 * // => "2 hours ago"
 */
export function getRelativeTime(dateString: string): string {
  return dayjs(dateString).tz(TZ).fromNow();
}

/**
 * Get the configured timezone name
 *
 * @returns Timezone name (e.g., "Asia/Tokyo")
 */
export function getTimezone(): string {
  return TZ;
}

/**
 * Get the timezone abbreviation (e.g., "JST")
 *
 * @returns Timezone abbreviation
 */
export function getTimezoneAbbr(): string {
  return dayjs().tz(TZ).format("z");
}
