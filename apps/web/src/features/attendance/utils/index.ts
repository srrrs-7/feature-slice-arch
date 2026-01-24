import { get } from "svelte/store";
import { locale } from "$lib/i18n";

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
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    month: currentLocale === "ja" ? "numeric" : "short",
    day: "numeric",
    weekday: "short",
  };
  return date.toLocaleDateString(
    currentLocale === "ja" ? "ja-JP" : "en-US",
    options,
  );
}

/**
 * Format Date/string to HH:MM:SS format
 * @example formatTime(new Date()) => "09:00:00"
 */
export function formatTime(date: Date | string | null): string {
  if (!date) return "--:--:--";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Format Date/string to HH:MM format (without seconds)
 * @example formatTimeShort(new Date()) => "09:00"
 */
export function formatTimeShort(date: Date | string | null): string {
  if (!date) return "--:--";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const date = new Date(year, month - 1);
  return date.toLocaleDateString(currentLocale === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "long",
  });
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
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  return date.toLocaleDateString(
    currentLocale === "ja" ? "ja-JP" : "en-US",
    options,
  );
}
