import type { Task as PrismaTask } from "@api/lib/db";
import { prisma, wrapAsyncWithLog } from "@api/lib/db";
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
const findAll = (): ResultAsync<readonly Task[], TaskError> =>
  wrapAsyncWithLog(
    "taskRepository.findAll",
    {},
    () => prisma.task.findMany({ orderBy: { createdAt: "desc" } }),
    TaskErrors.database,
  ).map((tasks) => Object.freeze(tasks.map(toDomain)));

const findById = (id: TaskId): ResultAsync<Task, TaskError> =>
  wrapAsyncWithLog(
    "taskRepository.findById",
    { id },
    () => prisma.task.findUnique({ where: { id: id as string } }),
    TaskErrors.database,
  ).andThen((task) =>
    task ? ok(toDomain(task)) : err(TaskErrors.notFound(id)),
  );

const create = (params: {
  readonly title: string;
  readonly description: string | null;
}): ResultAsync<Task, TaskError> =>
  wrapAsyncWithLog(
    "taskRepository.create",
    { title: params.title },
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

const update = (
  id: TaskId,
  params: {
    readonly title?: string;
    readonly description?: string | null;
    readonly status?: TaskStatus;
  },
): ResultAsync<Task, TaskError> =>
  wrapAsyncWithLog(
    "taskRepository.update",
    { id, ...params },
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

const remove = (id: TaskId): ResultAsync<TaskId, TaskError> =>
  wrapAsyncWithLog(
    "taskRepository.remove",
    { id },
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
