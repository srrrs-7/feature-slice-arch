import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if code is running in a browser environment
 *
 * @returns true if in browser, false if SSR
 *
 * @example
 * if (isBrowser()) {
 *   window.localStorage.setItem("key", "value");
 * }
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// Utility types for shadcn-svelte components
export type WithElementRef<T, E extends HTMLElement = HTMLElement> = T & {
  ref?: E | null;
};

export type WithoutChildren<T> = Omit<T, "children">;

export type WithoutChildrenOrChild<T> = Omit<T, "children" | "child">;
