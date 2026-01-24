<script lang="ts">
import { Button } from "$lib/components/ui/button";
import { t } from "$lib/i18n";
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
    void saveTitle();
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
  <div class="mb-4 sm:mb-6">
    <div class="flex items-center justify-between mb-3 sm:mb-4">
      <Button variant="ghost" size="sm" onclick={onBack} class="text-sm sm:text-base">
        ← {$t.taskDetail.backToList}
      </Button>
      <Button variant="destructive" size="sm" onclick={onDelete} class="text-sm sm:text-base">
        {$t.common.delete}
      </Button>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
      <div class="flex-1 min-w-0 order-2 sm:order-1">
        {#if isEditingTitle}
          <!-- svelte-ignore a11y_autofocus -->
          <input
            type="text"
            bind:value={editTitle}
            on:blur={saveTitle}
            on:keydown={handleTitleKeydown}
            class="text-xl sm:text-2xl lg:text-3xl font-bold w-full px-2 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary"
            maxlength={200}
            autofocus
          />
        {:else}
          <button
            type="button"
            class="text-xl sm:text-2xl lg:text-3xl font-bold cursor-pointer hover:text-primary transition-colors text-left w-full bg-transparent border-none p-0"
            on:click={startEditTitle}
          >
            {$currentTask.title}
          </button>
        {/if}
      </div>

      <div class="order-1 sm:order-2 flex-shrink-0">
        <TaskStatusBadge
          status={$currentTask.status}
          clickable
          onClick={handleStatusClick}
        />
      </div>
    </div>
  </div>
{/if}
