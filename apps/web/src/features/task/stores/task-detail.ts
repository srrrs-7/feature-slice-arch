import { writable } from "svelte/store";
import * as api from "../api";
import type { Task, TaskStatus } from "../types";

export const currentTask = writable<Task | null>(null);
export const detailIsLoading = writable<boolean>(false);
export const detailError = writable<string | null>(null);

export const taskDetailStore = {
  async fetchById(id: string): Promise<void> {
    detailIsLoading.set(true);
    detailError.set(null);
    try {
      const data = await api.getTaskById(id);
      currentTask.set(data.task);
    } catch (err) {
      detailError.set(
        err instanceof Error ? err.message : "Failed to load task",
      );
      currentTask.set(null);
    } finally {
      detailIsLoading.set(false);
    }
  },

  async updateTitle(id: string, title: string): Promise<void> {
    // Optimistic update
    let original: Task | null = null;
    currentTask.update((task) => {
      if (!task) return task;
      original = task;
      return { ...task, title };
    });

    try {
      const data = await api.updateTask(id, { title });
      currentTask.set(data.task);
    } catch (err) {
      // Rollback on error
      if (original) {
        currentTask.set(original);
      }
      detailError.set(
        err instanceof Error ? err.message : "Failed to update title",
      );
      throw err;
    }
  },

  async updateDescription(
    id: string,
    description: string | null,
  ): Promise<void> {
    // Optimistic update
    let original: Task | null = null;
    currentTask.update((task) => {
      if (!task) return task;
      original = task;
      return { ...task, description };
    });

    try {
      const data = await api.updateTask(id, { description });
      currentTask.set(data.task);
    } catch (err) {
      // Rollback on error
      if (original) {
        currentTask.set(original);
      }
      detailError.set(
        err instanceof Error ? err.message : "Failed to update description",
      );
      throw err;
    }
  },

  async updateStatus(id: string, status: TaskStatus): Promise<void> {
    // Optimistic update
    let original: Task | null = null;
    currentTask.update((task) => {
      if (!task) return task;
      original = task;
      return { ...task, status };
    });

    try {
      const data = await api.updateTask(id, { status });
      currentTask.set(data.task);
    } catch (err) {
      // Rollback on error
      if (original) {
        currentTask.set(original);
      }
      detailError.set(
        err instanceof Error ? err.message : "Failed to update status",
      );
      throw err;
    }
  },

  async deleteTask(id: string): Promise<void> {
    detailIsLoading.set(true);
    detailError.set(null);
    try {
      await api.deleteTask(id);
      currentTask.set(null);
    } catch (err) {
      detailError.set(
        err instanceof Error ? err.message : "Failed to delete task",
      );
      throw err;
    } finally {
      detailIsLoading.set(false);
    }
  },

  clear(): void {
    currentTask.set(null);
    detailError.set(null);
    detailIsLoading.set(false);
  },
};
