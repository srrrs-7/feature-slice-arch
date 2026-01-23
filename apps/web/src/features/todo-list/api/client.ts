import type { AppType } from "@api/index";
import { hc } from "hono/client";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Create typed Hono RPC client
export const client = hc<AppType>(apiUrl);

// Export route clients
export const tasksApi = client.api.tasks;
