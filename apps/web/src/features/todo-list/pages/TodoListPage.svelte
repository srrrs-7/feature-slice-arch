<script lang="ts">
import { onMount } from "svelte";
import CreateTaskDialog from "../components/CreateTaskDialog.svelte";
import TaskFilterBar from "../components/TaskFilterBar.svelte";
import TaskList from "../components/TaskList.svelte";
import TodoListHeader from "../components/TodoListHeader.svelte";
import { error, tasksStore } from "../stores";

export let navigateToDetail: ((id: string) => void) | undefined = undefined;

onMount(() => {
  void tasksStore.fetchAll();
});
</script>

<div class="container mx-auto py-8 px-4 max-w-6xl">
  <TodoListHeader />

  {#if $error}
    <div class="bg-destructive/15 border border-destructive text-destructive-foreground px-4 py-3 rounded-lg mb-6">
      <strong>Error:</strong> {$error}
    </div>
  {/if}

  <TaskFilterBar />
  <TaskList {navigateToDetail} />

  <CreateTaskDialog />
</div>
