<svelte:options runes={true} />

<script lang="ts">
import { t } from "$lib/i18n";
import type { Task, TaskStatus } from "../types";
import TaskCard from "./TaskCard.svelte";

interface Props {
  navigateToDetail?: (id: string) => void;
  tasks: Task[];
  isLoading?: boolean;
  onUpdateStatus: (id: string, status: TaskStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isDeleting?: boolean;
}

let {
  navigateToDetail,
  tasks,
  isLoading = false,
  onUpdateStatus,
  onDelete,
  isDeleting = false,
}: Props = $props();
</script>

{#if isLoading && tasks.length === 0}
  <div class="flex justify-center py-8 sm:py-12">
    <div class="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
  </div>
{:else if tasks.length === 0}
  <div class="text-center py-8 sm:py-12">
    <p class="text-sm sm:text-base text-muted-foreground">
      {$t.tasks.noTasks}
    </p>
    <p class="text-xs sm:text-sm text-muted-foreground mt-1">
      {$t.tasks.noTasksDescription}
    </p>
  </div>
{:else}
  <div class="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
    {#each tasks as task (task.id)}
      <TaskCard
        {task}
        {navigateToDetail}
        {onUpdateStatus}
        {onDelete}
        {isDeleting}
      />
    {/each}
  </div>
{/if}
