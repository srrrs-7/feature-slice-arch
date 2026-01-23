import { derived, writable } from "svelte/store";
import type { TaskFilter } from "../types";
import { tasks } from "./tasks";

export const currentFilter = writable<TaskFilter>("all");

export const filteredTasks = derived(
  [tasks, currentFilter],
  ([$tasks, $filter]) => {
    if ($filter === "all") return $tasks;
    return $tasks.filter((task) => task.status === $filter);
  },
);

export function setFilter(filter: TaskFilter) {
  currentFilter.set(filter);
}
