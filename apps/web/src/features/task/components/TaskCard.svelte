<svelte:options runes={true} />

<script lang="ts">
import { Button } from "@/components/ui/button";
import * as Card from "@/components/ui/card";
import { formatDateCompact } from "$lib/utils/date";
import type { Task, TaskStatus } from "../types";
import TaskStatusBadge from "./TaskStatusBadge.svelte";

interface Props {
  task: Task;
  navigateToDetail?: (id: string) => void;
  onUpdateStatus: (id: string, status: TaskStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isDeleting?: boolean;
}

let {
  task,
  navigateToDetail,
  onUpdateStatus,
  onDelete,
  isDeleting = false,
}: Props = $props();

const statusCycle: Record<TaskStatus, TaskStatus> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "pending",
};

async function handleStatusToggle() {
  const newStatus = statusCycle[task.status];
  try {
    await onUpdateStatus(task.id, newStatus);
  } catch (err) {
    console.error("Failed to update status:", err);
  }
}

async function handleDelete(e: Event) {
  e.stopPropagation(); // Prevent card click
  if (!confirm("Are you sure you want to delete this task?")) return;
  try {
    await onDelete(task.id);
  } catch (err) {
    console.error("Failed to delete task:", err);
  }
}

function handleCardClick() {
  if (navigateToDetail) {
    navigateToDetail(task.id);
  }
}
</script>

<Card.Root class="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]" onclick={handleCardClick}>
  <Card.Header class="p-4 sm:p-6">
    <div class="flex items-start justify-between gap-3 sm:gap-4">
      <div class="flex-1 min-w-0">
        <Card.Title class="text-base sm:text-lg line-clamp-2">{task.title}</Card.Title>
        <Card.Description class="mt-1 text-xs sm:text-sm line-clamp-2">
          {#if task.description}
            {task.description}
          {:else}
            <span class="text-muted-foreground italic">No description</span>
          {/if}
        </Card.Description>
      </div>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        role="group"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => e.stopPropagation()}
        class="flex-shrink-0"
      >
        <TaskStatusBadge status={task.status} clickable onClick={handleStatusToggle} />
      </div>
    </div>
  </Card.Header>
  <Card.Footer class="flex justify-between items-center p-4 sm:p-6 pt-0 sm:pt-0">
    <span class="text-[10px] sm:text-xs text-muted-foreground">
      {formatDateCompact(task.createdAt)}
    </span>
    <div class="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onclick={handleDelete}
        disabled={isDeleting}
        class="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  </Card.Footer>
</Card.Root>
