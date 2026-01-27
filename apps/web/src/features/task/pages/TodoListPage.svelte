<svelte:options runes={true} />

<script lang="ts">
import CreateTaskDialog from "../components/CreateTaskDialog.svelte";
import TaskFilterBar from "../components/TaskFilterBar.svelte";
import TaskList from "../components/TaskList.svelte";
import TodoListHeader from "../components/TodoListHeader.svelte";
import {
  createDeleteTaskMutation,
  createTaskMutation,
  createTasksQuery,
  createUpdateTaskMutation,
} from "../queries";
import { currentFilter, dialogActions, dialogs } from "../stores";
import type { CreateTaskInput, TaskStatus, UpdateTaskInput } from "../types";

interface Props {
  navigateToDetail?: (id: string) => void;
}

let { navigateToDetail }: Props = $props();

// Use TanStack Query for data fetching and mutations
const tasksQuery = createTasksQuery();
const createMutation = createTaskMutation();
const updateMutation = createUpdateTaskMutation();
const deleteMutation = createDeleteTaskMutation();

// Filter tasks based on current filter
const filteredTasks = $derived.by(() => {
  const tasks = tasksQuery.data ?? [];
  const filter = $currentFilter;
  if (filter === "all") return tasks;
  return tasks.filter((task) => task.status === filter);
});

// Handlers for child components
async function handleCreateTask(input: CreateTaskInput) {
  await createMutation.mutateAsync(input);
  dialogActions.closeCreate();
}

async function handleUpdateStatus(id: string, status: TaskStatus) {
  await updateMutation.mutateAsync({ id, input: { status } });
}

async function handleDeleteTask(id: string) {
  await deleteMutation.mutateAsync(id);
}
</script>

<div class="py-4 sm:py-6 lg:py-8">
  <TodoListHeader />

  {#if tasksQuery.isError}
    <div class="bg-destructive/15 border border-destructive text-destructive-foreground px-4 py-3 rounded-lg mb-6">
      <strong>Error:</strong> {tasksQuery.error?.message || "Failed to fetch tasks"}
    </div>
  {/if}

  <TaskFilterBar />
  <TaskList
    {navigateToDetail}
    tasks={filteredTasks}
    isLoading={tasksQuery.isPending}
    onUpdateStatus={handleUpdateStatus}
    onDelete={handleDeleteTask}
    isDeleting={deleteMutation.isPending}
  />

  <CreateTaskDialog
    open={$dialogs.createTask}
    onOpenChange={(open) => !open && dialogActions.closeCreate()}
    onCreate={handleCreateTask}
    isCreating={createMutation.isPending}
  />
</div>
