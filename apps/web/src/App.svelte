<script lang="ts">
import { onMount } from "svelte";
import TaskDetailPage from "./features/todo-detail/pages/TaskDetailPage.svelte";
import TodoListPage from "./features/todo-list/pages/TodoListPage.svelte";

let currentRoute: "list" | "detail" = "list";
let taskId: string | null = null;

function updateRoute() {
  const path = window.location.pathname;
  const match = path.match(/^\/tasks\/([a-f0-9-]+)$/);

  if (match) {
    currentRoute = "detail";
    taskId = match[1];
  } else {
    currentRoute = "list";
    taskId = null;
  }
}

function navigateToList() {
  window.history.pushState({}, "", "/");
  updateRoute();
}

function navigateToDetail(id: string) {
  window.history.pushState({}, "", `/tasks/${id}`);
  updateRoute();
}

onMount(() => {
  updateRoute();

  // Handle browser back/forward buttons
  window.addEventListener("popstate", updateRoute);

  return () => {
    window.removeEventListener("popstate", updateRoute);
  };
});
</script>

<main class="min-h-screen bg-background">
  {#if currentRoute === "list"}
    <TodoListPage {navigateToDetail} />
  {:else if currentRoute === "detail" && taskId}
    <TaskDetailPage {taskId} onNavigateBack={navigateToList} />
  {:else}
    <div class="container mx-auto py-8 px-4">
      <p>Page not found</p>
      <button on:click={navigateToList} class="text-primary hover:underline">
        ← Back to List
      </button>
    </div>
  {/if}
</main>
