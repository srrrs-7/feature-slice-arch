/**
 * Session Storage utilities (SSR-safe)
 */

import { isBrowser } from "$lib/utils";

/**
 * Get a value from sessionStorage
 *
 * @param key - Storage key
 * @returns Parsed value or null if not found/invalid
 *
 * @example
 * const token = get<string>("accessToken");
 * // => "abc123" or null
 */
export function get<T>(key: string): T | null {
  if (!isBrowser()) return null;

  try {
    const item = sessionStorage.getItem(key);
    if (item === null) return null;
    return JSON.parse(item) as T;
  } catch {
    return null;
  }
}

/**
 * Set a value in sessionStorage
 *
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified)
 * @returns true if successful, false otherwise
 *
 * @example
 * set("accessToken", "abc123");
 * // => true
 */
export function set<T>(key: string, value: T): boolean {
  if (!isBrowser()) return false;

  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all items from sessionStorage
 *
 * @example
 * clear();
 */
export function clear(): void {
  if (!isBrowser()) return;

  try {
    sessionStorage.clear();
  } catch {
    // Ignore errors
  }
}
