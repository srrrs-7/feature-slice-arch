<script lang="ts">
  import { filteredTasks, isLoading, tasks } from "../stores";
  import TaskCard from "./TaskCard.svelte";

  export let navigateToDetail: ((id: string) => void) | undefined = undefined;
</script>

{#if $isLoading && $tasks.length === 0}
  <div class="flex justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
{:else if $filteredTasks.length === 0}
  <div class="text-center py-12">
    <p class="text-muted-foreground">No tasks found. Create one to get started!</p>
  </div>
{:else}
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each $filteredTasks as task (task.id)}
      <TaskCard {task} {navigateToDetail} />
    {/each}
  </div>
{/if}
