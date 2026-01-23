<script lang="ts">
import { onDestroy, onMount } from "svelte";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog.svelte";
import TaskDetailDescription from "../components/TaskDetailDescription.svelte";
import TaskDetailHeader from "../components/TaskDetailHeader.svelte";
import TaskDetailMetadata from "../components/TaskDetailMetadata.svelte";
import { currentTask, error, isLoading, taskDetailStore } from "../stores";

export let taskId: string;
export let onNavigateBack: () => void;

let showDeleteDialog = false;

onMount(() => {
  if (taskId) {
    void taskDetailStore.fetchById(taskId);
  }
});

onDestroy(() => {
  taskDetailStore.clear();
});

function handleBack() {
  onNavigateBack();
}

function handleDeleteClick() {
  showDeleteDialog = true;
}

function handleDeleteConfirm() {
  showDeleteDialog = false;
  // Navigate back after successful deletion
  onNavigateBack();
}

function handleDeleteCancel() {
  showDeleteDialog = false;
}
</script>

<div class="container mx-auto py-8 px-4 max-w-4xl">
  {#if $isLoading && !$currentTask}
    <div class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  {:else if $error}
    <div class="bg-destructive/15 border border-destructive text-destructive-foreground px-4 py-3 rounded-lg mb-6">
      <strong>Error:</strong> {$error}
    </div>
    <button
      on:click={handleBack}
      class="text-primary hover:underline"
    >
      ← Back to List
    </button>
  {:else if $currentTask}
    <TaskDetailHeader onBack={handleBack} onDelete={handleDeleteClick} />
    <TaskDetailDescription />
    <TaskDetailMetadata />
  {:else}
    <div class="text-center py-12">
      <h2 class="text-2xl font-semibold text-muted-foreground mb-4">
        Task Not Found
      </h2>
      <p class="text-muted-foreground mb-6">
        The task you're looking for doesn't exist or has been deleted.
      </p>
      <button
        on:click={handleBack}
        class="text-primary hover:underline"
      >
        ← Back to List
      </button>
    </div>
  {/if}
</div>

<DeleteConfirmDialog
  open={showDeleteDialog}
  onConfirm={handleDeleteConfirm}
  onCancel={handleDeleteCancel}
/>
