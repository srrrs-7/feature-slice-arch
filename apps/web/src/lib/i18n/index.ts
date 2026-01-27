import dayjs from "dayjs";
import "dayjs/locale/ja";
import { derived, get, writable } from "svelte/store";
import { en } from "./locales/en";
import { ja } from "./locales/ja";
import type { Locale, Translations } from "./types";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./types";

// Re-export types
export type { Locale, LocaleInfo, Translations } from "./types";
export { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./types";

/**
 * Translation dictionary
 */
const translations: Record<Locale, Translations> = {
  ja,
  en,
};

/**
 * Storage key for persisting locale
 */
const LOCALE_STORAGE_KEY = "app-locale";

/**
 * Get initial locale from:
 * 1. localStorage (user preference)
 * 2. Browser language
 * 3. Default locale
 */
function getInitialLocale(): Locale {
  // Check localStorage first
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isValidLocale(stored)) {
      return stored;
    }

    // Check browser language
    const browserLang = navigator.language.split("-")[0];
    if (isValidLocale(browserLang)) {
      return browserLang;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Check if a string is a valid locale
 */
function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.some((l) => l.code === locale);
}

/**
 * Current locale store
 */
export const locale = writable<Locale>(getInitialLocale());

/**
 * Subscribe to locale changes and persist to localStorage
 */
if (typeof window !== "undefined") {
  locale.subscribe((value) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, value);
    // Update HTML lang attribute
    document.documentElement.lang = value;
  });
}

/**
 * Current translations derived from locale
 */
export const t = derived(locale, ($locale) => translations[$locale]);

/**
 * Set the current locale
 */
export function setLocale(newLocale: Locale): void {
  if (isValidLocale(newLocale)) {
    locale.set(newLocale);
  }
}

/**
 * Get current locale synchronously
 */
export function getLocale(): Locale {
  return get(locale);
}

/**
 * Get translation for a specific key path
 * Usage: translate('common.save') => '保存'
 */
export function translate(keyPath: string): string {
  const $locale = get(locale);
  const keys = keyPath.split(".");
  let result: unknown = translations[$locale];

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      console.warn(`Translation key not found: ${keyPath}`);
      return keyPath;
    }
  }

  return typeof result === "string" ? result : keyPath;
}

/**
 * Reactive translation helper for use in components
 * Returns a derived store that updates when locale changes
 */
export function i18n(keyPath: string) {
  return derived(locale, ($locale) => {
    const keys = keyPath.split(".");
    let result: unknown = translations[$locale];

    for (const key of keys) {
      if (result && typeof result === "object" && key in result) {
        result = (result as Record<string, unknown>)[key];
      } else {
        return keyPath;
      }
    }

    return typeof result === "string" ? result : keyPath;
  });
}

/**
 * Format date according to current locale
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const $locale = get(locale);
  const localeCode = $locale === "ja" ? "ja" : "en";
  const d = dayjs(date).locale(localeCode);

  const hasWeekday = options?.weekday != null;
  if (localeCode === "ja") {
    return hasWeekday
      ? d.format("YYYY年M月D日（dddd）")
      : d.format("YYYY年M月D日");
  }

  return hasWeekday
    ? d.format("MMMM D, YYYY (dddd)")
    : d.format("MMMM D, YYYY");
}

/**
 * Format time according to current locale
 */
export function formatTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const $locale = get(locale);
  const localeCode = $locale === "ja" ? "ja" : "en";
  const d = dayjs(date).locale(localeCode);

  const includeSeconds = options?.second != null;
  if (localeCode === "ja") {
    return includeSeconds ? d.format("HH:mm:ss") : d.format("HH:mm");
  }

  return includeSeconds ? d.format("h:mm:ss A") : d.format("h:mm A");
}

/**
 * Format date and time according to current locale
 */
export function formatDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const $locale = get(locale);
  const localeCode = $locale === "ja" ? "ja" : "en";
  const d = dayjs(date).locale(localeCode);

  const includeSeconds = options?.second != null;
  if (localeCode === "ja") {
    return includeSeconds
      ? d.format("YYYY/MM/DD HH:mm:ss")
      : d.format("YYYY/MM/DD HH:mm");
  }

  return includeSeconds
    ? d.format("MMM D, YYYY h:mm:ss A")
    : d.format("MMM D, YYYY h:mm A");
}
