// =============================================================================
// PKCE Utilities
// =============================================================================

import type { PKCEParams } from "../types";

const PKCE_VERIFIER_KEY = "pkce_code_verifier";
const PKCE_STATE_KEY = "pkce_state";

// =============================================================================
// PKCE Parameter Generation
// =============================================================================

/**
 * Generate a random string for code verifier or state.
 * Uses crypto.getRandomValues for secure randomness.
 */
function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues)
    .map((value) => chars[value % chars.length])
    .join("");
}

/**
 * Generate code verifier (43-128 characters, RFC 7636).
 */
export function generateCodeVerifier(): string {
  return generateRandomString(64);
}

/**
 * Generate state parameter for CSRF protection.
 */
export function generateState(): string {
  return generateRandomString(32);
}

/**
 * Generate code challenge from code verifier using SHA-256.
 * Uses base64url encoding (RFC 7636).
 */
export async function generateCodeChallenge(
  codeVerifier: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);

  // Base64url encode the digest
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generate all PKCE parameters.
 */
export async function generatePKCEParams(): Promise<PKCEParams> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  return {
    codeVerifier,
    codeChallenge,
    state,
  };
}

// =============================================================================
// Session Storage
// =============================================================================

/**
 * Store PKCE parameters in sessionStorage.
 * Used during the OAuth flow to persist across redirects.
 */
export function storePKCEParams(params: PKCEParams): void {
  sessionStorage.setItem(PKCE_VERIFIER_KEY, params.codeVerifier);
  sessionStorage.setItem(PKCE_STATE_KEY, params.state);
}

/**
 * Retrieve PKCE parameters from sessionStorage.
 */
export function getPKCEParams(): {
  codeVerifier: string | null;
  state: string | null;
} {
  return {
    codeVerifier: sessionStorage.getItem(PKCE_VERIFIER_KEY),
    state: sessionStorage.getItem(PKCE_STATE_KEY),
  };
}

/**
 * Clear PKCE parameters from sessionStorage.
 * Should be called after successful token exchange.
 */
export function clearPKCEParams(): void {
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  sessionStorage.removeItem(PKCE_STATE_KEY);
}

/**
 * Validate state parameter for CSRF protection.
 */
export function validateState(receivedState: string): boolean {
  const storedState = sessionStorage.getItem(PKCE_STATE_KEY);
  return storedState !== null && storedState === receivedState;
}
