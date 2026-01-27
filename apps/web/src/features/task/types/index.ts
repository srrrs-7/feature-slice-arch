// Client-side types (JSON serialized - dates are strings)
export type TaskId = string;
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  readonly id: TaskId;
  readonly title: string;
  readonly description: string | null;
  readonly status: TaskStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// Client-specific types
export type TaskFilter = "all" | "pending" | "in_progress" | "completed";

export interface CreateTaskInput {
  title: string;
  description?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: "pending" | "in_progress" | "completed";
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
}

export interface DialogState {
  createTask: boolean;
  editTask: { open: boolean; taskId: string | null };
  deleteTask: { open: boolean; taskId: string | null };
}
