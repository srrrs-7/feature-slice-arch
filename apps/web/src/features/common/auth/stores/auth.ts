// =============================================================================
// Auth Store
// =============================================================================

import dayjs from "dayjs";
import { derived, get, writable } from "svelte/store";
import type {
  AuthState,
  AuthUser,
  CognitoConfig,
  IdTokenPayload,
  TokenSet,
} from "../types";
import {
  clearPKCEParams,
  generatePKCEParams,
  getPKCEParams,
  storePKCEParams,
  validateState,
} from "./pkce";

// =============================================================================
// Constants
// =============================================================================

const REFRESH_TOKEN_KEY = "auth_refresh_token";
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

// =============================================================================
// Configuration
// =============================================================================

/**
 * Get Cognito configuration from environment variables.
 */
export function getCognitoConfig(): CognitoConfig {
  return {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "",
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? "",
    domain: import.meta.env.VITE_COGNITO_DOMAIN ?? "",
    redirectUri:
      import.meta.env.VITE_COGNITO_REDIRECT_URI ??
      "http://localhost:3000/auth/callback",
    logoutUri:
      import.meta.env.VITE_COGNITO_LOGOUT_URI ?? "http://localhost:3000/login",
    scope: import.meta.env.VITE_COGNITO_SCOPE ?? "openid email profile",
  };
}

/**
 * Check if Cognito is configured.
 */
export function isCognitoConfigured(): boolean {
  const config = getCognitoConfig();
  return !!(config.userPoolId && config.clientId && config.domain);
}

// =============================================================================
// Token Utilities
// =============================================================================

/**
 * Decode JWT token payload (without verification).
 */
function decodeJWT<T>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

/**
 * Extract user information from ID token.
 */
function extractUserFromIdToken(idToken: string): AuthUser | null {
  const payload = decodeJWT<IdTokenPayload>(idToken);
  if (!payload) return null;

  return {
    cognitoSub: payload.sub,
    email: payload.email ?? null,
    emailVerified: payload.email_verified ?? false,
    name: payload.name ?? null,
    picture: payload.picture ?? null,
    groups: payload["cognito:groups"] ?? [],
  };
}

/**
 * Check if token is expired or about to expire.
 */
function isTokenExpired(token: string, thresholdMs = 0): boolean {
  const payload = decodeJWT<{ exp: number }>(token);
  if (!payload?.exp) return true;

  const expiryTime = payload.exp * 1000;
  return dayjs().valueOf() + thresholdMs >= expiryTime;
}

// =============================================================================
// Store
// =============================================================================

/**
 * Auth state store.
 */
export const authState = writable<AuthState>({ status: "idle" });

/**
 * Derived store for current user.
 */
export const currentUser = derived(authState, ($state) =>
  $state.status === "authenticated" ? $state.user : null,
);

/**
 * Derived store for authentication status.
 */
export const isAuthenticated = derived(
  authState,
  ($state) => $state.status === "authenticated",
);

/**
 * Derived store for loading status.
 */
export const isAuthLoading = derived(
  authState,
  ($state) => $state.status === "loading",
);

// =============================================================================
// Local Storage
// =============================================================================

/**
 * Store refresh token in localStorage.
 */
function storeRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * Get refresh token from localStorage.
 */
function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Clear refresh token from localStorage.
 */
function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// =============================================================================
// Auth Actions
// =============================================================================

/**
 * Start the login flow by redirecting to Cognito Hosted UI.
 * @param returnTo - URL to redirect to after successful login (stored in sessionStorage)
 */
export async function login(returnTo?: string): Promise<void> {
  const config = getCognitoConfig();

  if (!isCognitoConfigured()) {
    console.error("Cognito is not configured");
    authState.set({ status: "error", error: "Authentication not configured" });
    return;
  }

  // Store return URL in sessionStorage for use after callback
  if (returnTo) {
    sessionStorage.setItem("auth_return_to", returnTo);
  }

  // Generate PKCE parameters
  const pkceParams = await generatePKCEParams();
  storePKCEParams(pkceParams);

  // Build authorization URL
  const authUrl = new URL(`https://${config.domain}/oauth2/authorize`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("scope", config.scope);
  authUrl.searchParams.set("code_challenge", pkceParams.codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", pkceParams.state);

  // Redirect to Cognito
  window.location.href = authUrl.toString();
}

/**
 * Result of handling the OAuth callback.
 */
export interface CallbackResult {
  success: boolean;
  error?: string;
}

/**
 * Handle the OAuth callback after redirect from Cognito.
 */
export async function handleCallback(
  code: string,
  state: string,
): Promise<CallbackResult> {
  authState.set({ status: "loading" });

  try {
    // Validate state
    if (!validateState(state)) {
      throw new Error("Invalid state parameter - possible CSRF attack");
    }

    // Get stored code verifier
    const { codeVerifier } = getPKCEParams();
    if (!codeVerifier) {
      throw new Error("Code verifier not found - session may have expired");
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier);

    // Extract user from ID token
    const user = extractUserFromIdToken(tokens.idToken);
    if (!user) {
      throw new Error("Failed to extract user from token");
    }

    // Store refresh token
    if (tokens.refreshToken) {
      storeRefreshToken(tokens.refreshToken);
    }

    // Clear PKCE params
    clearPKCEParams();

    // Update state
    authState.set({
      status: "authenticated",
      user,
      tokens,
    });

    return { success: true };
  } catch (error) {
    console.error("Callback error:", error);
    clearPKCEParams();
    const errorMessage =
      error instanceof Error ? error.message : "Authentication failed";
    authState.set({
      status: "error",
      error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Exchange authorization code for tokens.
 */
async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
): Promise<TokenSet> {
  const config = getCognitoConfig();

  const tokenUrl = `https://${config.domain}/oauth2/token`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token ?? null,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  };
}

/**
 * Refresh the access token using the refresh token.
 */
export async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    authState.set({ status: "unauthenticated" });
    return false;
  }

  const config = getCognitoConfig();

  try {
    const tokenUrl = `https://${config.domain}/oauth2/token`;

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.clientId,
      refresh_token: refreshToken,
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const data = await response.json();

    const tokens: TokenSet = {
      accessToken: data.access_token,
      idToken: data.id_token,
      refreshToken: refreshToken, // Refresh token is not returned on refresh
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };

    const user = extractUserFromIdToken(tokens.idToken);
    if (!user) {
      throw new Error("Failed to extract user from token");
    }

    authState.set({
      status: "authenticated",
      user,
      tokens,
    });

    return true;
  } catch (error) {
    console.error("Token refresh error:", error);
    clearRefreshToken();
    authState.set({ status: "unauthenticated" });
    return false;
  }
}

/**
 * Logout the user.
 */
export function logout(redirectToLogin = true): void {
  const config = getCognitoConfig();

  // Clear local state
  clearRefreshToken();
  clearPKCEParams();
  authState.set({ status: "unauthenticated" });

  if (redirectToLogin && isCognitoConfigured()) {
    // Redirect to Cognito logout endpoint
    const logoutUrl = new URL(`https://${config.domain}/logout`);
    logoutUrl.searchParams.set("client_id", config.clientId);
    logoutUrl.searchParams.set("logout_uri", config.logoutUri);

    window.location.href = logoutUrl.toString();
  }
}

/**
 * Initialize auth state on app load.
 * Tries to restore session from refresh token.
 */
export async function initializeAuth(): Promise<void> {
  authState.set({ status: "loading" });

  if (!isCognitoConfigured()) {
    console.warn("Cognito not configured - auth disabled");
    authState.set({ status: "unauthenticated" });
    return;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    authState.set({ status: "unauthenticated" });
    return;
  }

  const success = await refreshTokens();
  if (!success) {
    authState.set({ status: "unauthenticated" });
  }
}

/**
 * Get current access token.
 * Automatically refreshes if expired or about to expire.
 */
export async function getAccessToken(): Promise<string | null> {
  const state = get(authState);

  if (state.status !== "authenticated") {
    return null;
  }

  // Check if token needs refresh
  if (isTokenExpired(state.tokens.accessToken, TOKEN_REFRESH_THRESHOLD)) {
    const success = await refreshTokens();
    if (!success) return null;

    const newState = get(authState);
    if (newState.status === "authenticated") {
      return newState.tokens.accessToken;
    }
    return null;
  }

  return state.tokens.accessToken;
}

/**
 * Get authorization header for API requests.
 */
export async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}
