// Re-export domain types
export type { Task, TaskError, TaskId, TaskStatus } from "./domain/task.ts";

// Export route handler
export { default as taskRoutes } from "./handler.ts";
