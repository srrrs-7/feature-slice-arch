import type { AppType } from "@api/index";
import { hc } from "hono/client";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
const authToken = import.meta.env.VITE_AUTH_TOKEN || "dummy-bearer-token-12345";

// Create typed Hono RPC client with authorization header
export const client = hc<AppType>(apiUrl, {
  headers: {
    Authorization: `Bearer ${authToken}`,
  },
});

// Export route clients
export const tasksApi = client.api.tasks;
