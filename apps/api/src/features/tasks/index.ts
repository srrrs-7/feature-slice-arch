import type {
  CreateTaskInput,
  TaskError,
  UpdateTaskInput,
} from "./domain/task.ts";
import { taskService } from "./service/service.ts";

// Re-export domain types
export type { Task, TaskError, TaskId, TaskStatus } from "./domain/task.ts";

// JSON response helpers (pure functions)
const jsonResponse = <T>(data: T, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const errorToStatus = (error: TaskError): number => {
  switch (error.type) {
    case "NOT_FOUND":
      return 404;
    case "VALIDATION_ERROR":
      return 400;
    case "ALREADY_EXISTS":
      return 409;
    case "DATABASE_ERROR":
      return 500;
  }
};

const formatErrorMessage = (error: TaskError): string => {
  switch (error.type) {
    case "NOT_FOUND":
      return `Task not found: ${error.taskId}`;
    case "VALIDATION_ERROR":
      return error.message;
    case "ALREADY_EXISTS":
      return `Task already exists: ${error.taskId}`;
    case "DATABASE_ERROR":
      return "Database error occurred";
  }
};

const errorResponse = (error: TaskError): Response =>
  jsonResponse(
    { error: error.type, message: formatErrorMessage(error) },
    errorToStatus(error),
  );

// Route handlers (all async due to ResultAsync)
export const taskHandlers = {
  // GET /api/tasks
  getAll: (): Promise<Response> =>
    taskService.getAll().match(
      (tasks) => jsonResponse({ tasks }),
      (error) => errorResponse(error),
    ),

  // GET /api/tasks/:id
  getById: (id: string): Promise<Response> =>
    taskService.getById(id).match(
      (task) => jsonResponse({ task }),
      (error) => errorResponse(error),
    ),

  // POST /api/tasks
  create: async (request: Request): Promise<Response> => {
    const body = (await request.json()) as CreateTaskInput;
    return taskService.create(body).match(
      (task) => jsonResponse({ task }, 201),
      (error) => errorResponse(error),
    );
  },

  // PUT /api/tasks/:id
  update: async (request: Request, id: string): Promise<Response> => {
    const body = (await request.json()) as UpdateTaskInput;
    return taskService.update(id, body).match(
      (task) => jsonResponse({ task }),
      (error) => errorResponse(error),
    );
  },

  // DELETE /api/tasks/:id
  delete: (id: string): Promise<Response> =>
    taskService.delete(id).match(
      (taskId) => jsonResponse({ deleted: taskId }),
      (error) => errorResponse(error),
    ),
} as const;
