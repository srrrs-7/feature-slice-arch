<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import TaskStatusBadge from "../../todo-list/components/TaskStatusBadge.svelte";
  import { currentTask, taskDetailStore } from "../stores";
  import type { TaskStatus } from "../types";

  export let onBack: () => void;
  export let onDelete: () => void;

  let isEditingTitle = false;
  let editTitle = "";

  function startEditTitle() {
    if (!$currentTask) return;
    editTitle = $currentTask.title;
    isEditingTitle = true;
  }

  function cancelEditTitle() {
    isEditingTitle = false;
    editTitle = "";
  }

  async function saveTitle() {
    if (!$currentTask || !editTitle.trim()) {
      cancelEditTitle();
      return;
    }

    try {
      await taskDetailStore.updateTitle($currentTask.id, editTitle.trim());
      isEditingTitle = false;
    } catch (err) {
      console.error("Failed to update title:", err);
    }
  }

  function handleTitleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTitle();
    } else if (e.key === "Escape") {
      cancelEditTitle();
    }
  }

  async function handleStatusClick() {
    if (!$currentTask) return;

    const statusCycle: Record<TaskStatus, TaskStatus> = {
      pending: "in_progress",
      in_progress: "completed",
      completed: "pending",
    };

    const newStatus = statusCycle[$currentTask.status];
    try {
      await taskDetailStore.updateStatus($currentTask.id, newStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }
</script>

{#if $currentTask}
  <div class="mb-6">
    <div class="flex items-center justify-between mb-4">
      <Button variant="ghost" size="sm" on:click={onBack}>
        ← Back to List
      </Button>
      <Button variant="destructive" size="sm" on:click={onDelete}>
        Delete
      </Button>
    </div>

    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        {#if isEditingTitle}
          <input
            type="text"
            bind:value={editTitle}
            on:blur={saveTitle}
            on:keydown={handleTitleKeydown}
            class="text-3xl font-bold w-full px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary"
            maxlength={200}
            autofocus
          />
        {:else}
          <h1
            class="text-3xl font-bold cursor-pointer hover:text-primary transition-colors"
            on:click={startEditTitle}
            role="button"
            tabindex="0"
            on:keydown={(e) => e.key === "Enter" && startEditTitle()}
          >
            {$currentTask.title}
          </h1>
        {/if}
      </div>

      <TaskStatusBadge
        status={$currentTask.status}
        clickable
        onClick={handleStatusClick}
      />
    </div>
  </div>
{/if}
