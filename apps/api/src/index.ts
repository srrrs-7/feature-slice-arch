import { Hono } from "hono";
import { attendanceRoutes, stampRoutes } from "./features/attendance/index.ts";
import { fileRoutes } from "./features/file/index.ts";
import { taskRoutes } from "./features/tasks/index.ts";
import { logger } from "./lib/logger/index.ts";
import { bearerAuthMiddleware } from "./middleware/bearer.ts";
import { corsMiddleware } from "./middleware/cors.ts";

const app = new Hono()
  .use("*", corsMiddleware)
  .use("/api/*", bearerAuthMiddleware)
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/api/tasks", taskRoutes)
  .route("/api/stamps", stampRoutes)
  .route("/api/attendance", attendanceRoutes)
  .route("/api/files", fileRoutes)
  .notFound((c) => c.json({ error: "Not Found" }, 404))
  .onError((err, c) => {
    logger.error({ err }, "Server error");
    return c.json({ error: "Internal Server Error" }, 500);
  });

// Start server
const port = Number(process.env.PORT) || 8080;

export default {
  port,
  fetch: app.fetch,
};

// Export AppType for Hono RPC client
export type AppType = typeof app;

logger.info({ port }, "Server running");
