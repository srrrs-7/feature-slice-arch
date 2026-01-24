/**
 * Supported languages
 */
export type Locale = "ja" | "en";

/**
 * Translation keys structure
 */
export interface Translations {
  // Common
  common: {
    appName: string;
    loading: string;
    error: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    close: string;
    back: string;
    confirm: string;
    yes: string;
    no: string;
    search: string;
    noData: string;
  };

  // Navigation
  nav: {
    home: string;
    tasks: string;
    stamp: string;
    settings: string;
    openMenu: string;
    closeMenu: string;
    collapseSidebar: string;
    expandSidebar: string;
  };

  // Home page
  home: {
    title: string;
    subtitle: string;
    welcome: string;
    quickActions: string;
    viewTasks: string;
    recordAttendance: string;
    recentActivity: string;
  };

  // Tasks
  tasks: {
    title: string;
    subtitle: string;
    createTask: string;
    editTask: string;
    deleteTask: string;
    taskTitle: string;
    taskDescription: string;
    status: string;
    all: string;
    pending: string;
    inProgress: string;
    completed: string;
    noTasks: string;
    noTasksDescription: string;
    confirmDelete: string;
    confirmDeleteMessage: string;
    createdAt: string;
    updatedAt: string;
    titleRequired: string;
    titlePlaceholder: string;
    descriptionPlaceholder: string;
  };

  // Task detail
  taskDetail: {
    title: string;
    backToList: string;
    statusLabel: string;
    descriptionLabel: string;
    noDescription: string;
    createdAtLabel: string;
    updatedAtLabel: string;
  };

  // Stamp (Attendance)
  stamp: {
    title: string;
    subtitle: string;
    clockIn: string;
    clockOut: string;
    breakStart: string;
    breakEnd: string;
    status: {
      notStarted: string;
      working: string;
      onBreak: string;
      finished: string;
    };
    todayRecord: string;
    noRecord: string;
    workingTime: string;
    breakTime: string;
  };

  // Language
  language: {
    label: string;
    japanese: string;
    english: string;
  };

  // Errors
  errors: {
    networkError: string;
    serverError: string;
    notFound: string;
    unauthorized: string;
    validationError: string;
    unknownError: string;
  };

  // Accessibility
  a11y: {
    skipToContent: string;
    currentPage: string;
    externalLink: string;
    required: string;
  };
}

/**
 * Locale metadata
 */
export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
];

export const DEFAULT_LOCALE: Locale = "ja";
