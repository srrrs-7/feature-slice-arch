import {
  createMutation,
  createQuery,
  useQueryClient,
} from "@tanstack/svelte-query";
import { queryKeys } from "$lib/query";
import * as api from "../api";
import type { CreateTaskInput, Task, UpdateTaskInput } from "../types";

/**
 * Query: Fetch all tasks
 *
 * Cache: 5 minutes (default staleTime)
 * Retry: 3 times with exponential backoff
 */
export function createTasksQuery() {
  return createQuery(() => ({
    queryKey: queryKeys.tasks.lists(),
    queryFn: async () => {
      const data = await api.getTasks();
      return data.tasks;
    },
  }));
}

/**
 * Query: Fetch a single task by ID
 *
 * Cache: 5 minutes (default staleTime)
 * Retry: 3 times with exponential backoff
 */
export function createTaskQuery(id: () => string) {
  return createQuery(() => ({
    queryKey: queryKeys.tasks.detail(id()),
    queryFn: async () => {
      const data = await api.getTaskById(id());
      return data.task;
    },
    enabled: !!id(),
  }));
}

/**
 * Mutation: Create a new task
 *
 * On success: Invalidates tasks list cache
 * No retry (default for mutations)
 */
export function createTaskMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: async (input: CreateTaskInput) => {
      const data = await api.createTask(input);
      return data.task;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  }));
}

/**
 * Mutation: Update an existing task
 *
 * Optimistic update: Updates cache immediately, rolls back on error
 * On success: Invalidates both list and detail caches
 */
export function createUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return createMutation<
    Task,
    Error,
    { id: string; input: UpdateTaskInput },
    {
      previousTasks: Task[] | undefined;
      previousTask: Task | undefined;
      id: string;
    }
  >(() => ({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateTaskInput;
    }) => {
      const data = await api.updateTask(id, input);
      return data.task;
    },
    onMutate: async ({ id, input }: { id: string; input: UpdateTaskInput }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.detail(id) });

      const previousTasks = queryClient.getQueryData<Task[]>(
        queryKeys.tasks.lists(),
      );
      const previousTask = queryClient.getQueryData<Task>(
        queryKeys.tasks.detail(id),
      );

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(queryKeys.tasks.lists(), (old) =>
          old?.map((t) => (t.id === id ? { ...t, ...input } : t)),
        );
      }

      if (previousTask) {
        queryClient.setQueryData<Task>(queryKeys.tasks.detail(id), (old) =>
          old ? { ...old, ...input } : old,
        );
      }

      return { previousTasks, previousTask, id };
    },
    onError: (
      _err: Error,
      _variables: { id: string; input: UpdateTaskInput },
      context:
        | {
            previousTasks: Task[] | undefined;
            previousTask: Task | undefined;
            id: string;
          }
        | undefined,
    ) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          queryKeys.tasks.lists(),
          context.previousTasks,
        );
      }
      if (context?.previousTask && context?.id) {
        queryClient.setQueryData(
          queryKeys.tasks.detail(context.id),
          context.previousTask,
        );
      }
    },
    onSettled: (
      _data: Task | undefined,
      _error: Error | null,
      variables: { id: string; input: UpdateTaskInput },
    ) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.detail(variables.id),
      });
    },
  }));
}

/**
 * Mutation: Delete a task
 *
 * Optimistic update: Removes from cache immediately, rolls back on error
 * On success: Invalidates tasks list cache
 */
export function createDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return createMutation<
    string,
    Error,
    string,
    { previousTasks: Task[] | undefined }
  >(() => ({
    mutationFn: async (id: string) => {
      await api.deleteTask(id);
      return id;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.lists() });

      const previousTasks = queryClient.getQueryData<Task[]>(
        queryKeys.tasks.lists(),
      );

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(queryKeys.tasks.lists(), (old) =>
          old?.filter((t) => t.id !== id),
        );
      }

      return { previousTasks };
    },
    onError: (
      _err: Error,
      _id: string,
      context: { previousTasks: Task[] | undefined } | undefined,
    ) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          queryKeys.tasks.lists(),
          context.previousTasks,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  }));
}
