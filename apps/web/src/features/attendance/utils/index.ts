import dayjs from "dayjs";
import "dayjs/locale/ja";
import { get } from "svelte/store";
import { locale } from "$lib/i18n";

function getDayjsLocale(currentLocale: string): "ja" | "en" {
  return currentLocale === "ja" ? "ja" : "en";
}

/**
 * Format minutes to duration string
 * @example formatMinutesToDuration(510, "ja") => "8時間30分"
 * @example formatMinutesToDuration(510, "en") => "8h 30m"
 */
export function formatMinutesToDuration(
  minutes: number,
  localeOverride?: string,
): string {
  const currentLocale = localeOverride ?? get(locale);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (currentLocale === "ja") {
    if (hours === 0) return `${mins}分`;
    if (mins === 0) return `${hours}時間`;
    return `${hours}時間${mins}分`;
  }

  // English
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Format minutes to HH:MM format
 * @example formatMinutesToHHMM(510) => "8:30"
 */
export function formatMinutesToHHMM(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${String(mins).padStart(2, "0")}`;
}

/**
 * Format ISO date string to date with weekday
 * @example formatDateWithWeekday("2026-01-15", "ja") => "1月15日（水）"
 * @example formatDateWithWeekday("2026-01-15", "en") => "Jan 15 (Wed)"
 */
export function formatDateWithWeekday(
  dateStr: string,
  localeOverride?: string,
): string {
  const currentLocale = localeOverride ?? get(locale);
  const localeCode = getDayjsLocale(currentLocale);
  const date = dayjs(dateStr).locale(localeCode);
  if (localeCode === "ja") {
    return date.format("M月D日（ddd）");
  }
  return date.format("MMM D (ddd)");
}

/**
 * Format Date/string to HH:MM:SS format
 * @example formatTime(new Date()) => "09:00:00"
 */
export function formatTime(date: string | null, localeOverride?: string): string {
  if (!date) return "--:--:--";
  const currentLocale = localeOverride ?? get(locale);
  const localeCode = getDayjsLocale(currentLocale);
  const d = dayjs(date).locale(localeCode);
  return localeCode === "ja" ? d.format("HH:mm:ss") : d.format("h:mm:ss A");
}

/**
 * Format Date/string to HH:MM format (without seconds)
 * @example formatTimeShort(new Date()) => "09:00"
 */
export function formatTimeShort(
  date: string | null,
  localeOverride?: string,
): string {
  if (!date) return "--:--";
  const currentLocale = localeOverride ?? get(locale);
  const localeCode = getDayjsLocale(currentLocale);
  const d = dayjs(date).locale(localeCode);
  return localeCode === "ja" ? d.format("HH:mm") : d.format("h:mm A");
}

/**
 * Get Badge variant based on work minutes
 * - 0: outline (no data)
 * - 1-480: default (normal, <= 8 hours)
 * - 481-600: secondary (overtime, <= 10 hours)
 * - 601+: destructive (long hours, > 10 hours)
 */
export function getWorkStatusVariant(
  workMinutes: number,
): "default" | "secondary" | "destructive" | "outline" {
  if (workMinutes === 0) return "outline";
  if (workMinutes <= 480) return "default";
  if (workMinutes <= 600) return "secondary";
  return "destructive";
}

/**
 * Format month label for display
 * @example formatMonthLabel(2026, 1, "ja") => "2026年1月"
 * @example formatMonthLabel(2026, 1, "en") => "January 2026"
 */
export function formatMonthLabel(
  year: number,
  month: number,
  localeOverride?: string,
): string {
  const currentLocale = localeOverride ?? get(locale);
  const localeCode = getDayjsLocale(currentLocale);
  const date = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).locale(
    localeCode,
  );
  return localeCode === "ja"
    ? date.format("YYYY年M月")
    : date.format("MMMM YYYY");
}

/**
 * Format full date for display
 * @example formatFullDate("2026-01-15", "ja") => "2026年1月15日（水）"
 */
export function formatFullDate(
  dateStr: string,
  localeOverride?: string,
): string {
  const currentLocale = localeOverride ?? get(locale);
  const localeCode = getDayjsLocale(currentLocale);
  const date = dayjs(dateStr).locale(localeCode);
  return localeCode === "ja"
    ? date.format("YYYY年M月D日（dddd）")
    : date.format("MMMM D, YYYY (dddd)");
}
