<svelte:options runes={true} />

<script lang="ts">
import DeleteConfirmDialog from "../components/DeleteConfirmDialog.svelte";
import TaskDetailDescription from "../components/TaskDetailDescription.svelte";
import TaskDetailHeader from "../components/TaskDetailHeader.svelte";
import TaskDetailMetadata from "../components/TaskDetailMetadata.svelte";
import {
  createDeleteTaskMutation,
  createTaskQuery,
  createUpdateTaskMutation,
} from "../queries";
import type { TaskStatus, UpdateTaskInput } from "../types";

interface Props {
  taskId: string;
  onNavigateBack: () => void;
}

let { taskId, onNavigateBack }: Props = $props();

let showDeleteDialog = $state(false);

// Use TanStack Query for data fetching and mutations
const taskQuery = createTaskQuery(() => taskId);
const updateMutation = createUpdateTaskMutation();
const deleteMutation = createDeleteTaskMutation();

function handleBack() {
  onNavigateBack();
}

function handleDeleteClick() {
  showDeleteDialog = true;
}

function handleDeleteCancel() {
  showDeleteDialog = false;
}

// Handlers for child components
async function handleUpdateTask(input: UpdateTaskInput) {
  await updateMutation.mutateAsync({ id: taskId, input });
}

async function handleUpdateStatus(status: TaskStatus) {
  await handleUpdateTask({ status });
}

async function handleUpdateTitle(title: string) {
  await handleUpdateTask({ title });
}

async function handleUpdateDescription(description: string | null) {
  await handleUpdateTask({ description });
}

async function handleDeleteTask() {
  await deleteMutation.mutateAsync(taskId);
  showDeleteDialog = false;
  onNavigateBack();
}
</script>

<div class="py-4 sm:py-6 lg:py-8 max-w-4xl mx-auto">
  {#if taskQuery.isPending && !taskQuery.data}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  {:else if taskQuery.isError}
    <div class="bg-destructive/15 border border-destructive text-destructive-foreground px-4 py-3 rounded-lg mb-6">
      <strong>Error:</strong> {taskQuery.error?.message || "Failed to fetch task"}
    </div>
    <button
      onclick={handleBack}
      class="text-primary hover:underline"
    >
      ← Back to List
    </button>
  {:else if taskQuery.data}
    <TaskDetailHeader
      task={taskQuery.data}
      onBack={handleBack}
      onDelete={handleDeleteClick}
      onUpdateStatus={handleUpdateStatus}
      onUpdateTitle={handleUpdateTitle}
    />
    <TaskDetailDescription
      task={taskQuery.data}
      onUpdateDescription={handleUpdateDescription}
    />
    <TaskDetailMetadata task={taskQuery.data} />
  {:else}
    <div class="text-center py-12">
      <h2 class="text-xl sm:text-2xl font-semibold text-muted-foreground mb-4">
        Task Not Found
      </h2>
      <p class="text-muted-foreground mb-6">
        The task you're looking for doesn't exist or has been deleted.
      </p>
      <button
        onclick={handleBack}
        class="text-primary hover:underline"
      >
        ← Back to List
      </button>
    </div>
  {/if}
</div>

<DeleteConfirmDialog
  open={showDeleteDialog}
  task={taskQuery.data}
  onConfirm={handleDeleteTask}
  onCancel={handleDeleteCancel}
  isDeleting={deleteMutation.isPending}
/>
