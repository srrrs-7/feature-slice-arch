import { Hono } from "hono";
import { taskRoutes } from "./features/tasks/index.ts";

const app = new Hono();

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Task routes
app.route("/api/tasks", taskRoutes);

// 404 handler
app.notFound((c) => c.json({ error: "Not Found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

// Start server
const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};

console.log(`Server running at http://localhost:${port}`);
