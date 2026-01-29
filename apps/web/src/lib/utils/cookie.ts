/**
 * Cookie utilities (SSR-safe)
 */

import { isBrowser } from "$lib/utils";

/**
 * Options for setting cookies
 */
export interface CookieOptions {
  /** Expiration in days (number) or specific Date */
  expires?: number | Date;
  /** Cookie path (default: "/") */
  path?: string;
  /** Cookie domain */
  domain?: string;
  /** Secure flag - only send over HTTPS */
  secure?: boolean;
  /** SameSite attribute for CSRF protection */
  sameSite?: "strict" | "lax" | "none";
}

function buildCookieString(
  name: string,
  value: string,
  options: CookieOptions = {},
): string {
  const { expires, path = "/", domain, secure, sameSite } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (expires !== undefined) {
    const expiresDate =
      typeof expires === "number"
        ? new Date(Date.now() + expires * 24 * 60 * 60 * 1000)
        : expires;
    cookieString += `; expires=${expiresDate.toUTCString()}`;
  }

  cookieString += `; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  if (secure) {
    cookieString += "; secure";
  }

  if (sameSite) {
    cookieString += `; samesite=${sameSite}`;
  }

  return cookieString;
}

/**
 * Get a cookie value by name
 *
 * @param name - Cookie name
 * @returns Cookie value (JSON parsed) or null if not found
 *
 * @example
 * const settings = get<{ theme: string }>("settings");
 * // => { theme: "dark" } or null
 */
export function get<T>(name: string): T | null {
  if (!isBrowser()) return null;

  try {
    const cookies = document.cookie.split(";");
    const encodedName = encodeURIComponent(name);

    for (const cookie of cookies) {
      const [cookieName, ...valueParts] = cookie.trim().split("=");
      if (cookieName === encodedName) {
        const value = decodeURIComponent(valueParts.join("="));
        return JSON.parse(value) as T;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Set a cookie
 *
 * @param name - Cookie name
 * @param value - Value to store (will be JSON stringified)
 * @param options - Cookie options (expires, path, domain, secure, sameSite)
 *
 * @example
 * set("settings", { theme: "dark" }, { expires: 365 });
 */
export function set<T>(name: string, value: T, options?: CookieOptions): void {
  if (!isBrowser()) return;

  try {
    const stringified = JSON.stringify(value);
    document.cookie = buildCookieString(name, stringified, options);
  } catch {
    // Ignore errors
  }
}

/**
 * Clear a cookie by name
 *
 * @param name - Cookie name to remove
 * @param options - Cookie options (path, domain must match original)
 *
 * @example
 * clear("settings");
 */
export function clear(name: string, options?: CookieOptions): void {
  if (!isBrowser()) return;

  try {
    const deleteOptions: CookieOptions = {
      ...options,
      expires: new Date(0),
    };
    document.cookie = buildCookieString(name, "", deleteOptions);
  } catch {
    // Ignore errors
  }
}
