/**
 * Time utilities using dayjs
 *
 * Strategy:
 * - All dates are stored in UTC in the database
 * - Convert to local timezone only for display purposes
 * - Use toUTC() before saving to DB
 * - Use toTimezone() when returning to client
 */

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

// Initialize plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Default timezone for display (can be overridden per request)
const DEFAULT_TIMEZONE = process.env.TZ ?? "Asia/Tokyo";

/**
 * Get current time in UTC (for DB storage)
 */
export const nowUTC = (): Date => dayjs.utc().toDate();

/**
 * Convert any date to UTC Date object (for DB storage)
 */
export const toUTC = (date: Date | string | dayjs.Dayjs): Date =>
  dayjs(date).utc().toDate();

/**
 * Convert UTC date to specific timezone
 */
export const toTimezone = (
  date: Date | string | dayjs.Dayjs,
  tz: string = DEFAULT_TIMEZONE,
): dayjs.Dayjs => dayjs(date).tz(tz);

/**
 * Format date in specific timezone
 */
export const formatInTimezone = (
  date: Date | string | dayjs.Dayjs,
  format: string = "YYYY-MM-DD HH:mm:ss",
  tz: string = DEFAULT_TIMEZONE,
): string => dayjs(date).tz(tz).format(format);

/**
 * Format date as ISO string in specific timezone
 */
export const toISOStringInTimezone = (
  date: Date | string | dayjs.Dayjs,
  tz: string = DEFAULT_TIMEZONE,
): string => dayjs(date).tz(tz).format();

/**
 * Parse date string in specific timezone and convert to UTC
 */
export const parseInTimezoneToUTC = (
  dateString: string,
  tz: string = DEFAULT_TIMEZONE,
): Date => dayjs.tz(dateString, tz).utc().toDate();

/**
 * Check if date is valid
 */
export const isValidDate = (date: unknown): boolean =>
  dayjs(date as string | Date).isValid();

/**
 * Get start of day in UTC
 */
export const startOfDayUTC = (date: Date | string | dayjs.Dayjs): Date =>
  dayjs(date).utc().startOf("day").toDate();

/**
 * Get end of day in UTC
 */
export const endOfDayUTC = (date: Date | string | dayjs.Dayjs): Date =>
  dayjs(date).utc().endOf("day").toDate();

// Re-export dayjs for advanced usage
export { dayjs };
