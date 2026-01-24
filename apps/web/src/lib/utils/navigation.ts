/**
 * Simple navigation utilities for SPA routing
 */

/**
 * Navigate to a new URL, updating browser history
 */
export function goto(url: string, options?: { replaceState?: boolean }): void {
  if (options?.replaceState) {
    window.history.replaceState({}, "", url);
  } else {
    window.history.pushState({}, "", url);
  }
  // Dispatch a popstate event to trigger route updates
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/**
 * Replace the current URL in history without navigation
 */
export function replaceState(url: string): void {
  window.history.replaceState({}, "", url);
}

/**
 * Get current URL pathname
 */
export function getCurrentPath(): string {
  return window.location.pathname;
}

/**
 * Get current URL search params
 */
export function getSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}
