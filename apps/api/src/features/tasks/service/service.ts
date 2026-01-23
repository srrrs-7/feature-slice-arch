import {
  err,
  errAsync,
  ok,
  okAsync,
  type Result,
  type ResultAsync,
} from "neverthrow";
import { z } from "zod";
import {
  type CreateTaskInput,
  createTaskId,
  type Task,
  type TaskError,
  TaskErrors,
  type TaskId,
  type UpdateTaskInput,
} from "../domain/task.ts";
import { taskRepository } from "../repository/repository.ts";

// Zod schemas for validation
const taskIdSchema = z
  .string()
  .trim()
  .min(1, "Task ID cannot be empty")
  .transform((id) => createTaskId(id));

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title cannot be empty")
  .max(200, "Title must be 200 characters or less");

const descriptionSchema = z
  .string()
  .trim()
  .max(1000, "Description must be 1000 characters or less")
  .transform((val) => (val.length === 0 ? null : val))
  .nullable()
  .optional()
  .transform((val) => val ?? null);

const taskStatusSchema = z.enum(["pending", "in_progress", "completed"]);

const createTaskInputSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
});

const updateTaskInputSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema,
  status: taskStatusSchema.optional(),
});

// Helper to convert zod result to neverthrow Result
const parseWith = <T>(
  schema: z.ZodType<T>,
  data: unknown,
): Result<T, TaskError> => {
  const result = schema.safeParse(data);
  if (result.success) {
    return ok(result.data);
  }
  // zod 4 uses `issues` instead of `errors`
  const firstIssue = result.error.issues[0];
  return err(TaskErrors.validation(firstIssue?.message ?? "Validation failed"));
};

// Helper to convert sync Result to ResultAsync
const liftAsync = <T, E>(result: Result<T, E>): ResultAsync<T, E> =>
  result.match(
    (value) => okAsync(value),
    (error) => errAsync(error),
  );

// Service functions using functional composition with ResultAsync
export const getAllTasks = (): ResultAsync<readonly Task[], TaskError> =>
  taskRepository.findAll();

export const getTaskById = (id: string): ResultAsync<Task, TaskError> =>
  liftAsync(parseWith(taskIdSchema, id)).andThen(taskRepository.findById);

export const createTask = (
  input: CreateTaskInput,
): ResultAsync<Task, TaskError> =>
  liftAsync(parseWith(createTaskInputSchema, input)).andThen(
    ({ title, description }) => taskRepository.create({ title, description }),
  );

export const updateTask = (
  id: string,
  input: UpdateTaskInput,
): ResultAsync<Task, TaskError> =>
  liftAsync(parseWith(taskIdSchema, id)).andThen((taskId) =>
    liftAsync(parseWith(updateTaskInputSchema, input)).andThen(
      ({ title, description, status }) =>
        taskRepository.update(taskId, {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status }),
        }),
    ),
  );

export const deleteTask = (id: string): ResultAsync<TaskId, TaskError> =>
  liftAsync(parseWith(taskIdSchema, id)).andThen(taskRepository.remove);

// Service as a namespace
export const taskService = {
  getAll: getAllTasks,
  getById: getTaskById,
  create: createTask,
  update: updateTask,
  delete: deleteTask,
} as const;
