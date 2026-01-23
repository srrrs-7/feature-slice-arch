import {
  type DatabaseError,
  Errors,
  type ValidationError,
} from "@api/lib/error";

// Task entity types (immutable)

export type TaskId = string & { readonly _brand: unique symbol };

export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  readonly id: TaskId;
  readonly title: string;
  readonly description: string | null;
  readonly status: TaskStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Input types
export interface CreateTaskInput {
  readonly title: string;
  readonly description?: string | null;
}

export interface UpdateTaskInput {
  readonly title?: string;
  readonly description?: string | null;
  readonly status?: TaskStatus;
}

// Domain-specific error types
export type TaskNotFoundError = {
  readonly type: "NOT_FOUND";
  readonly taskId: TaskId;
};

export type TaskAlreadyExistsError = {
  readonly type: "ALREADY_EXISTS";
  readonly taskId: TaskId;
};

// Combined error type (common + domain-specific)
export type TaskError =
  | DatabaseError
  | ValidationError
  | TaskNotFoundError
  | TaskAlreadyExistsError;

// Smart constructors
export const createTaskId = (id: string): TaskId => id as TaskId;

export const createTask = (params: {
  id: TaskId;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}): Task => Object.freeze(params);

// Error constructors (using common errors + domain-specific)
export const TaskErrors = {
  notFound: (taskId: TaskId): TaskNotFoundError => ({
    type: "NOT_FOUND",
    taskId,
  }),
  validation: Errors.validation,
  alreadyExists: (taskId: TaskId): TaskAlreadyExistsError => ({
    type: "ALREADY_EXISTS",
    taskId,
  }),
  database: Errors.database,
} as const;
