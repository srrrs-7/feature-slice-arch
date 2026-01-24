import type { AppType } from "@api/index";
import { hc } from "hono/client";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * TODO: SECURITY - This is a DEVELOPMENT-ONLY token!
 * See apps/web/src/features/todo-list/api/client.ts for details.
 */
const authToken = import.meta.env.VITE_AUTH_TOKEN || "dummy-bearer-token-12345";

// Create typed Hono RPC client with authorization header
export const client = hc<AppType>(apiUrl, {
  headers: {
    Authorization: `Bearer ${authToken}`,
  },
});

// Export route client for attendance API
export const attendanceApi = client.api.attendance;
