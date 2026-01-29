/**
 * Local Storage utilities (SSR-safe)
 */

import { isBrowser } from "$lib/utils";

/**
 * Get a value from localStorage
 *
 * @param key - Storage key
 * @returns Parsed value or null if not found/invalid
 *
 * @example
 * const user = get<{ name: string }>("user");
 * // => { name: "John" } or null
 */
export function get<T>(key: string): T | null {
  if (!isBrowser()) return null;

  try {
    const item = localStorage.getItem(key);
    if (item === null) return null;
    return JSON.parse(item) as T;
  } catch {
    return null;
  }
}

/**
 * Set a value in localStorage
 *
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified)
 * @returns true if successful, false otherwise
 *
 * @example
 * set("user", { name: "John" });
 * // => true
 */
export function set<T>(key: string, value: T): boolean {
  if (!isBrowser()) return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all items from localStorage
 *
 * @example
 * clear();
 */
export function clear(): void {
  if (!isBrowser()) return;

  try {
    localStorage.clear();
  } catch {
    // Ignore errors
  }
}
