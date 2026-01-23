import type { AppType } from "@api/index";
import { hc } from "hono/client";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * TODO: SECURITY - This is a DEVELOPMENT-ONLY token!
 * Before production deployment, implement proper authentication:
 *
 * 1. OAuth2/OIDC Flow:
 *    - Redirect to identity provider for login
 *    - Handle callback with authorization code
 *    - Exchange code for access/refresh tokens
 *
 * 2. Token Storage:
 *    - Store refresh token in httpOnly cookie (server-side)
 *    - Store access token in memory only (not localStorage)
 *
 * 3. Token Refresh:
 *    - Implement automatic token refresh before expiration
 *    - Handle 401 responses with token refresh
 *
 * 4. Logout:
 *    - Clear tokens and redirect to login
 *    - Revoke tokens on identity provider
 *
 * Never use hardcoded tokens in production!
 */
const authToken = import.meta.env.VITE_AUTH_TOKEN || "dummy-bearer-token-12345";

// Create typed Hono RPC client with authorization header
export const client = hc<AppType>(apiUrl, {
  headers: {
    Authorization: `Bearer ${authToken}`,
  },
});

// Export route clients
export const tasksApi = client.api.tasks;
