<script lang="ts">
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { formatDateCompact } from "$lib/utils/date";
import { tasksStore } from "../stores";
import type { Task, TaskStatus } from "../types";
import TaskStatusBadge from "./TaskStatusBadge.svelte";

export let task: Task;
export let navigateToDetail: ((id: string) => void) | undefined = undefined;

const statusCycle: Record<TaskStatus, TaskStatus> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "pending",
};

async function handleStatusToggle() {
  const newStatus = statusCycle[task.status];
  try {
    await tasksStore.update(task.id, { status: newStatus });
  } catch (err) {
    console.error("Failed to update status:", err);
  }
}

async function handleDelete(e: Event) {
  e.stopPropagation(); // Prevent card click
  if (!confirm("Are you sure you want to delete this task?")) return;
  try {
    await tasksStore.delete(task.id);
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

<Card.Root class="cursor-pointer hover:shadow-md transition-shadow" onclick={handleCardClick}>
  <Card.Header>
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1 min-w-0">
        <Card.Title class="text-lg">{task.title}</Card.Title>
        <Card.Description class="mt-1">
          {#if task.description}
            {task.description}
          {:else}
            <span class="text-muted-foreground italic">No description</span>
          {/if}
        </Card.Description>
      </div>
      <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
      <div on:click={(e) => e.stopPropagation()}>
        <TaskStatusBadge status={task.status} clickable onClick={handleStatusToggle} />
      </div>
    </div>
  </Card.Header>
  <Card.Footer class="flex justify-between items-center">
    <span class="text-xs text-muted-foreground">
      {formatDateCompact(task.createdAt)}
    </span>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" onclick={handleDelete}>
        Delete
      </Button>
    </div>
  </Card.Footer>
</Card.Root>
