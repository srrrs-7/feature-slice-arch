import { writable } from "svelte/store";
import * as api from "../api";
import type { CreateTaskInput, Task, UpdateTaskInput } from "../types";

export const tasks = writable<Task[]>([]);
export const isLoading = writable<boolean>(false);
export const error = writable<string | null>(null);

export const tasksStore = {
  async fetchAll() {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.getTasks();
      tasks.set(data.tasks);
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      isLoading.set(false);
    }
  },

  async create(input: CreateTaskInput) {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.createTask(input);
      tasks.update((items) => [...items, data.task]);
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to create task");
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  async update(id: string, input: UpdateTaskInput) {
    isLoading.set(true);
    error.set(null);

    let original: Task | undefined;
    tasks.update((items) => {
      original = items.find((t) => t.id === id);
      return items.map((t) => (t.id === id ? { ...t, ...input } : t));
    });

    try {
      const data = await api.updateTask(id, input);
      tasks.update((items) => items.map((t) => (t.id === id ? data.task : t)));
    } catch (err) {
      if (original !== undefined) {
        const rollbackTo = original;
        tasks.update((items) =>
          items.map((t) => (t.id === id ? rollbackTo : t)),
        );
      }
      error.set(err instanceof Error ? err.message : "Failed to update task");
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  async delete(id: string) {
    isLoading.set(true);
    error.set(null);

    let original: Task[] = [];
    tasks.update((items) => {
      original = items;
      return items.filter((t) => t.id !== id);
    });

    try {
      await api.deleteTask(id);
    } catch (err) {
      tasks.set(original);
      error.set(err instanceof Error ? err.message : "Failed to delete task");
      throw err;
    } finally {
      isLoading.set(false);
    }
  },
};
