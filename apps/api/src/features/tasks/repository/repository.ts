import type { Task as PrismaTask } from "@api/lib/db";
import { prisma, wrapAsync } from "@api/lib/db";
import { isDatabaseNotFound } from "@api/lib/error";
import { err, ok, type ResultAsync } from "neverthrow";
import {
  createTask,
  createTaskId,
  type Task,
  type TaskError,
  TaskErrors,
  type TaskId,
  type TaskStatus,
} from "../domain/task.ts";

// Mapper: Prisma model -> Domain model
const toDomain = (prismaTask: PrismaTask): Task =>
  createTask({
    id: createTaskId(prismaTask.id),
    title: prismaTask.title,
    description: prismaTask.description,
    status: prismaTask.status as TaskStatus,
    createdAt: prismaTask.createdAt,
    updatedAt: prismaTask.updatedAt,
  });

// Repository functions returning ResultAsync types
export const findAll = (): ResultAsync<readonly Task[], TaskError> =>
  wrapAsync(
    () => prisma.task.findMany({ orderBy: { createdAt: "desc" } }),
    TaskErrors.database,
  ).map((tasks) => Object.freeze(tasks.map(toDomain)));

export const findById = (id: TaskId): ResultAsync<Task, TaskError> =>
  wrapAsync(
    () => prisma.task.findUnique({ where: { id: id as string } }),
    TaskErrors.database,
  ).andThen((task) =>
    task ? ok(toDomain(task)) : err(TaskErrors.notFound(id)),
  );

export const create = (params: {
  readonly title: string;
  readonly description: string | null;
}): ResultAsync<Task, TaskError> =>
  wrapAsync(
    () =>
      prisma.task.create({
        data: {
          title: params.title,
          description: params.description,
          status: "pending",
        },
      }),
    TaskErrors.database,
  ).map(toDomain);

export const update = (
  id: TaskId,
  params: {
    readonly title?: string;
    readonly description?: string | null;
    readonly status?: TaskStatus;
  },
): ResultAsync<Task, TaskError> =>
  wrapAsync(
    () =>
      prisma.task.update({
        where: { id: id as string },
        data: {
          ...(params.title !== undefined && { title: params.title }),
          ...(params.description !== undefined && {
            description: params.description,
          }),
          ...(params.status !== undefined && { status: params.status }),
        },
      }),
    TaskErrors.database,
  )
    .map(toDomain)
    .mapErr((error) =>
      isDatabaseNotFound(error) ? TaskErrors.notFound(id) : error,
    );

export const remove = (id: TaskId): ResultAsync<TaskId, TaskError> =>
  wrapAsync(
    () => prisma.task.delete({ where: { id: id as string } }),
    TaskErrors.database,
  )
    .map(() => id)
    .mapErr((error) =>
      isDatabaseNotFound(error) ? TaskErrors.notFound(id) : error,
    );

// Repository as a namespace
export const taskRepository = {
  findAll,
  findById,
  create,
  update,
  remove,
} as const;
