<script lang="ts">
import { onMount } from "svelte";
import { MainLayout } from "$lib/components/layouts";
import TaskDetailPage from "./features/todo-detail/pages/TaskDetailPage.svelte";
import TodoListPage from "./features/todo-list/pages/TodoListPage.svelte";

let currentRoute: "list" | "detail" = $state("list");
let taskId: string | null = $state(null);
let currentPath: string = $state("/");

function updateRoute() {
  const path = window.location.pathname;
  currentPath = path;
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

<MainLayout {currentPath}>
  {#if currentRoute === "list"}
    <TodoListPage {navigateToDetail} />
  {:else if currentRoute === "detail" && taskId}
    <TaskDetailPage {taskId} onNavigateBack={navigateToList} />
  {:else}
    <div class="container mx-auto py-8 px-4">
      <p>Page not found</p>
      <button onclick={navigateToList} class="text-primary hover:underline">
        ← Back to List
      </button>
    </div>
  {/if}
</MainLayout>
