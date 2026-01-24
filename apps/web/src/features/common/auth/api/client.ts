// =============================================================================
// Auth API Client
// =============================================================================

import type { AppType } from "@api/index";
import { hc } from "hono/client";
import { getAuthHeader } from "../stores";

// =============================================================================
// Client Setup
// =============================================================================

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Create Hono client with auth headers.
 */
export function createAuthClient() {
  return hc<AppType>(apiUrl);
}

// =============================================================================
// User API
// =============================================================================

export interface SyncUserResponse {
  user: {
    id: string;
    cognitoSub: string;
    email: string;
    name: string | null;
    role: string;
    status: string;
  };
}

/**
 * Sync user with backend after authentication.
 * Creates user if not exists, updates lastLoginAt if exists.
 */
export async function syncUser(): Promise<SyncUserResponse | null> {
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) {
      console.warn("No auth token available for user sync");
      return null;
    }

    const response = await fetch(`${apiUrl}/api/users/sync`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("User sync failed:", response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("User sync error:", error);
    return null;
  }
}

/**
 * Get current user from backend.
 */
export async function getCurrentUser(): Promise<SyncUserResponse | null> {
  try {
    const headers = await getAuthHeader();
    if (!headers.Authorization) {
      return null;
    }

    const response = await fetch(`${apiUrl}/api/users/me`, {
      headers,
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}
