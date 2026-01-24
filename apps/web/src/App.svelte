<script lang="ts">
import { onMount } from "svelte";
import { MainLayout } from "$lib/components/layouts";
import { t } from "$lib/i18n";
import {
  AttendanceDetailPage,
  AttendancePage,
} from "./features/attendance/pages";
import HomePage from "./features/home/pages/HomePage.svelte";
import StampPage from "./features/stamp/pages/StampPage.svelte";
import TaskDetailPage from "./features/todo-detail/pages/TaskDetailPage.svelte";
import TodoListPage from "./features/todo-list/pages/TodoListPage.svelte";

let currentRoute:
  | "home"
  | "tasks"
  | "detail"
  | "stamp"
  | "attendance"
  | "attendance-detail" = $state("home");
let taskId: string | null = $state(null);
let attendanceDate: string | null = $state(null);
let currentPath: string = $state("/");

// Get page title based on current route
const pageTitle = $derived.by(() => {
  switch (currentRoute) {
    case "home":
      return $t.home.title;
    case "tasks":
      return $t.tasks.title;
    case "detail":
      return $t.taskDetail.title;
    case "stamp":
      return $t.stamp.title;
    case "attendance":
    case "attendance-detail":
      return $t.attendance.title;
    default:
      return "";
  }
});

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
    attendanceDate = null;
    return;
  }

  // Check for attendance list route
  if (path === "/attendance") {
    currentRoute = "attendance";
    taskId = null;
    attendanceDate = null;
    return;
  }

  // Check for attendance detail route
  const attendanceMatch = path.match(/^\/attendance\/(\d{4}-\d{2}-\d{2})$/);
  if (attendanceMatch) {
    currentRoute = "attendance-detail";
    taskId = null;
    attendanceDate = attendanceMatch[1];
    return;
  }

  // Check for task detail route
  const match = path.match(/^\/tasks\/([a-f0-9-]+)$/);
  if (match) {
    currentRoute = "detail";
    taskId = match[1];
    attendanceDate = null;
    return;
  }

  // Default to home
  currentRoute = "home";
  taskId = null;
  attendanceDate = null;
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

function navigateToAttendance() {
  window.history.pushState({}, "", "/attendance");
  updateRoute();
}

function navigateToAttendanceDetail(date: string) {
  window.history.pushState({}, "", `/attendance/${date}`);
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

<MainLayout {currentPath} {pageTitle}>
  {#if currentRoute === "home"}
    <HomePage />
  {:else if currentRoute === "tasks"}
    <TodoListPage {navigateToDetail} />
  {:else if currentRoute === "detail" && taskId}
    <TaskDetailPage {taskId} onNavigateBack={navigateToTasks} />
  {:else if currentRoute === "stamp"}
    <StampPage />
  {:else if currentRoute === "attendance"}
    <AttendancePage onNavigateToDetail={navigateToAttendanceDetail} />
  {:else if currentRoute === "attendance-detail" && attendanceDate}
    <AttendanceDetailPage date={attendanceDate} onBack={navigateToAttendance} />
  {:else}
    <div class="container mx-auto py-8 px-4">
      <p>Page not found</p>
      <button onclick={navigateToHome} class="text-primary hover:underline">
        ← Back to Home
      </button>
    </div>
  {/if}
</MainLayout>
