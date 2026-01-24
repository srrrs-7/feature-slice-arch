<script lang="ts">
import { onMount } from "svelte";
import { MainLayout } from "$lib/components/layouts";
import HomePage from "./features/home/pages/HomePage.svelte";
import StampPage from "./features/stamp/pages/StampPage.svelte";
import TaskDetailPage from "./features/todo-detail/pages/TaskDetailPage.svelte";
import TodoListPage from "./features/todo-list/pages/TodoListPage.svelte";

let currentRoute: "home" | "tasks" | "detail" | "stamp" = $state("home");
let taskId: string | null = $state(null);
let currentPath: string = $state("/");

function updateRoute() {
  const path = window.location.pathname;
  currentPath = path;

  // Check for home route
  if (path === "/") {
    currentRoute = "home";
    taskId = null;
    return;
  }

  // Check for tasks list route
  if (path === "/tasks") {
    currentRoute = "tasks";
    taskId = null;
    return;
  }

  // Check for stamp route
  if (path === "/stamp") {
    currentRoute = "stamp";
    taskId = null;
    return;
  }

  // Check for task detail route
  const match = path.match(/^\/tasks\/([a-f0-9-]+)$/);
  if (match) {
    currentRoute = "detail";
    taskId = match[1];
    return;
  }

  // Default to home
  currentRoute = "home";
  taskId = null;
}

function navigateToHome() {
  window.history.pushState({}, "", "/");
  updateRoute();
}

function navigateToTasks() {
  window.history.pushState({}, "", "/tasks");
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
  {#if currentRoute === "home"}
    <HomePage />
  {:else if currentRoute === "tasks"}
    <TodoListPage {navigateToDetail} />
  {:else if currentRoute === "detail" && taskId}
    <TaskDetailPage {taskId} onNavigateBack={navigateToTasks} />
  {:else if currentRoute === "stamp"}
    <StampPage />
  {:else}
    <div class="container mx-auto py-8 px-4">
      <p>Page not found</p>
      <button onclick={navigateToHome} class="text-primary hover:underline">
        ← Back to Home
      </button>
    </div>
  {/if}
</MainLayout>
