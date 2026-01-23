import { taskHandlers } from "./features/tasks/index.ts";

// Extract path params helper
const extractId = (url: URL, prefix: string): string | null => {
  const path = url.pathname;
  if (path.startsWith(prefix) && path.length > prefix.length) {
    return path.slice(prefix.length);
  }
  return null;
};

// JSON error response
const errorResponse = (message: string, status: number): Response =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// Main server
const server = Bun.serve({
  port: process.env.PORT ?? 3000,

  fetch: async (req) => {
    const url = new URL(req.url);
    const method = req.method;

    // Health check
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Task routes
    const taskId = extractId(url, "/api/tasks/");
    if (taskId) {
      switch (method) {
        case "GET":
          return taskHandlers.getById(taskId);
        case "PUT":
          return taskHandlers.update(req, taskId);
        case "DELETE":
          return taskHandlers.delete(taskId);
        default:
          return errorResponse("Method Not Allowed", 405);
      }
    }

    if (url.pathname === "/api/tasks") {
      switch (method) {
        case "GET":
          return taskHandlers.getAll();
        case "POST":
          return taskHandlers.create(req);
        default:
          return errorResponse("Method Not Allowed", 405);
      }
    }

    return errorResponse("Not Found", 404);
  },

  error: (error) => {
    console.error("Server error:", error);
    return errorResponse("Internal Server Error", 500);
  },
});

console.log(`Server running at http://localhost:${server.port}`);
