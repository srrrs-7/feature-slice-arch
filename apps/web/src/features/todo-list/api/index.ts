import type { CreateTaskInput, Task, UpdateTaskInput } from "../types";
import { tasksApi } from "./client";

export async function getTasks(): Promise<{ tasks: Task[] }> {
  const res = await tasksApi.$get();
  if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.statusText}`);
  const data = await res.json();
  return { tasks: [...data.tasks] };
}

export async function getTaskById(id: string): Promise<{ task: Task }> {
  const res = await tasksApi[":id"].$get({ param: { id } });
  if (!res.ok) throw new Error(`Failed to fetch task: ${res.statusText}`);
  return await res.json();
}

export async function createTask(
  input: CreateTaskInput,
): Promise<{ task: Task }> {
  const res = await tasksApi.$post({ json: input });
  if (!res.ok) throw new Error(`Failed to create task: ${res.statusText}`);
  return await res.json();
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<{ task: Task }> {
  const res = await tasksApi[":id"].$put({ param: { id }, json: input });
  if (!res.ok) throw new Error(`Failed to update task: ${res.statusText}`);
  return await res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const res = await tasksApi[":id"].$delete({ param: { id } });
  if (!res.ok) throw new Error(`Failed to delete task: ${res.statusText}`);
}
