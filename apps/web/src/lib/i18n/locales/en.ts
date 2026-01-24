import type { Translations } from "../types";

export const en: Translations = {
  // Common
  common: {
    appName: "Todo App",
    loading: "Loading...",
    error: "Error",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    close: "Close",
    back: "Back",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    search: "Search",
    noData: "No data available",
  },

  // Navigation
  nav: {
    home: "Home",
    tasks: "Tasks",
    stamp: "Attendance",
    settings: "Settings",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
  },

  // Home page
  home: {
    title: "Dashboard",
    subtitle: "Manage your tasks and attendance today",
    welcome: "Welcome back",
    quickActions: "Quick Actions",
    viewTasks: "View Tasks",
    recordAttendance: "Clock In",
    recentActivity: "Recent Activity",
  },

  // Tasks
  tasks: {
    title: "Task List",
    subtitle: "Manage tasks and track progress",
    createTask: "Create Task",
    editTask: "Edit Task",
    deleteTask: "Delete Task",
    taskTitle: "Title",
    taskDescription: "Description",
    status: "Status",
    all: "All",
    pending: "Pending",
    inProgress: "In Progress",
    completed: "Completed",
    noTasks: "No tasks",
    noTasksDescription: "Create your first task to start managing your work.",
    confirmDelete: "Delete this task?",
    confirmDeleteMessage:
      "This action cannot be undone. The task will be permanently deleted.",
    createdAt: "Created at",
    updatedAt: "Updated at",
    titleRequired: "Title is required",
    titlePlaceholder: "Enter task title",
    descriptionPlaceholder: "Enter task description (optional)",
  },

  // Task detail
  taskDetail: {
    title: "Task Details",
    backToList: "Back to list",
    statusLabel: "Status",
    descriptionLabel: "Description",
    noDescription: "No description",
    createdAtLabel: "Created at",
    updatedAtLabel: "Updated at",
  },

  // Stamp (Attendance)
  stamp: {
    title: "Attendance",
    subtitle: "Clock in, clock out, and manage breaks",
    clockIn: "Clock In",
    clockOut: "Clock Out",
    breakStart: "Start Break",
    breakEnd: "End Break",
    status: {
      notStarted: "Not Started",
      working: "Working",
      onBreak: "On Break",
      finished: "Finished",
    },
    todayRecord: "Today's Record",
    noRecord: "No attendance record for today",
    workingTime: "Working Time",
    breakTime: "Break Time",
  },

  // Language
  language: {
    label: "Language",
    japanese: "日本語",
    english: "English",
  },

  // Errors
  errors: {
    networkError: "A network error occurred",
    serverError: "A server error occurred",
    notFound: "Not found",
    unauthorized: "Authentication required",
    validationError: "Please check your input",
    unknownError: "An unexpected error occurred",
  },

  // Accessibility
  a11y: {
    skipToContent: "Skip to content",
    currentPage: "Current page",
    externalLink: "External link",
    required: "Required",
  },
};
