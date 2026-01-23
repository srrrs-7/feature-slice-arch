import { writable } from "svelte/store";
import * as api from "../api";
import type { Task, TaskStatus } from "../types";

export const currentTask = writable<Task | null>(null);
export const isLoading = writable<boolean>(false);
export const error = writable<string | null>(null);

export const taskDetailStore = {
  async fetchById(id: string): Promise<void> {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.getTaskById(id);
      currentTask.set(data.task);
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to load task");
      currentTask.set(null);
    } finally {
      isLoading.set(false);
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
      error.set(err instanceof Error ? err.message : "Failed to update title");
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
      error.set(
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
      error.set(err instanceof Error ? err.message : "Failed to update status");
      throw err;
    }
  },

  async deleteTask(id: string): Promise<void> {
    isLoading.set(true);
    error.set(null);
    try {
      await api.deleteTask(id);
      currentTask.set(null);
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to delete task");
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  clear(): void {
    currentTask.set(null);
    error.set(null);
    isLoading.set(false);
  },
};
