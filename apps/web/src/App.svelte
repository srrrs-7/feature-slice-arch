<script lang="ts">
import { QueryClientProvider } from "@tanstack/svelte-query";
import { onMount } from "svelte";
import { MainLayout } from "@/components/layouts";
import { t } from "$lib/i18n";
import { getQueryClient } from "$lib/query";

const queryClient = getQueryClient();

import {
  AttendanceDetailPage,
  AttendancePage,
} from "./features/attendance/pages";
import {
  CallbackPage,
  initializeAuth,
  LoginPage,
} from "./features/common/auth";
import { FilePage } from "./features/file/pages";
import HomePage from "./features/home/pages/HomePage.svelte";
import StampPage from "./features/stamp/pages/StampPage.svelte";
import { TaskDetailPage, TodoListPage } from "./features/task/pages";

type Route =
  | "home"
  | "tasks"
  | "detail"
  | "stamp"
  | "attendance"
  | "attendance-detail"
  | "files"
  | "login"
  | "auth-callback";

let currentRoute: Route = $state("home");
let taskId: string | null = $state(null);
let attendanceDate: string | null = $state(null);
let currentPath: string = $state("/");

const routeTitle: Record<Route, () => string> = {
  home: () => $t.home.title,
  tasks: () => $t.tasks.title,
  detail: () => $t.taskDetail.title,
  stamp: () => $t.stamp.title,
  attendance: () => $t.attendance.title,
  "attendance-detail": () => $t.attendance.title,
  files: () => $t.files.title,
  login: () => $t.auth.login,
  "auth-callback": () => $t.auth.callback.processing,
};

const pageTitle = $derived.by(() => routeTitle[currentRoute]());

const attendanceDetailPattern = /^\/attendance\/(\d{4}-\d{2}-\d{2})$/;
const taskDetailPattern = /^\/tasks\/([a-f0-9-]+)$/;

type RouteMatch = {
  route: Route;
  taskId: string | null;
  attendanceDate: string | null;
};

function matchRoute(path: string): RouteMatch {
  if (path === "/login") {
    return { route: "login", taskId: null, attendanceDate: null };
  }
  if (path === "/auth/callback") {
    return { route: "auth-callback", taskId: null, attendanceDate: null };
  }
  if (path === "/") {
    return { route: "home", taskId: null, attendanceDate: null };
  }
  if (path === "/tasks") {
    return { route: "tasks", taskId: null, attendanceDate: null };
  }
  if (path === "/stamp") {
    return { route: "stamp", taskId: null, attendanceDate: null };
  }
  if (path === "/attendance") {
    return { route: "attendance", taskId: null, attendanceDate: null };
  }
  if (path === "/files") {
    return { route: "files", taskId: null, attendanceDate: null };
  }

  const attendanceMatch = path.match(attendanceDetailPattern);
  if (attendanceMatch) {
    return {
      route: "attendance-detail",
      taskId: null,
      attendanceDate: attendanceMatch[1],
    };
  }

  const taskMatch = path.match(taskDetailPattern);
  if (taskMatch) {
    return { route: "detail", taskId: taskMatch[1], attendanceDate: null };
  }

  return { route: "home", taskId: null, attendanceDate: null };
}

function updateRoute() {
  const path = window.location.pathname;
  currentPath = path;
  const matched = matchRoute(path);
  currentRoute = matched.route;
  taskId = matched.taskId;
  attendanceDate = matched.attendanceDate;
}

function navigate(path: string) {
  window.history.pushState({}, "", path);
  updateRoute();
}

const navigateToHome = () => navigate("/");
const navigateToTasks = () => navigate("/tasks");
const navigateToDetail = (id: string) => navigate(`/tasks/${id}`);
const navigateToAttendance = () => navigate("/attendance");
const navigateToAttendanceDetail = (date: string) =>
  navigate(`/attendance/${date}`);

onMount(() => {
  updateRoute();

  // Initialize authentication (check for existing tokens, refresh if needed)
  void initializeAuth();

  // Handle browser back/forward buttons
  window.addEventListener("popstate", updateRoute);

  return () => {
    window.removeEventListener("popstate", updateRoute);
  };
});
</script>

<QueryClientProvider client={queryClient}>
  {#if currentRoute === "login"}
    <LoginPage />
  {:else if currentRoute === "auth-callback"}
    <CallbackPage />
  {:else}
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
      {:else if currentRoute === "files"}
        <FilePage />
      {:else}
        <div class="container mx-auto py-8 px-4">
          <p>Page not found</p>
          <button onclick={navigateToHome} class="text-primary hover:underline">
            ← Back to Home
          </button>
        </div>
      {/if}
    </MainLayout>
  {/if}
</QueryClientProvider>
