import { derived } from "svelte/store";
import type { TaskStats } from "../types";
import { tasks } from "./tasks";

export const taskStats = derived<typeof tasks, TaskStats>(tasks, ($tasks) => ({
  total: $tasks.length,
  pending: $tasks.filter((t) => t.status === "pending").length,
  inProgress: $tasks.filter((t) => t.status === "in_progress").length,
  completed: $tasks.filter((t) => t.status === "completed").length,
}));
