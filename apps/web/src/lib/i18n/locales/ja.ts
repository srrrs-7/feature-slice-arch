import type { Translations } from "../types";

export const ja: Translations = {
  // Common
  common: {
    appName: "Todo App",
    loading: "読み込み中...",
    error: "エラー",
    save: "保存",
    cancel: "キャンセル",
    delete: "削除",
    edit: "編集",
    create: "作成",
    close: "閉じる",
    back: "戻る",
    confirm: "確認",
    yes: "はい",
    no: "いいえ",
    search: "検索",
    noData: "データがありません",
  },

  // Navigation
  nav: {
    home: "ホーム",
    tasks: "タスク",
    stamp: "打刻",
    attendance: "出勤簿",
    settings: "設定",
    openMenu: "メニューを開く",
    closeMenu: "メニューを閉じる",
    collapseSidebar: "サイドバーを縮小",
    expandSidebar: "サイドバーを展開",
  },

  // Home page
  home: {
    title: "ダッシュボード",
    subtitle: "今日のタスクと勤怠を管理しましょう",
    welcome: "おかえりなさい",
    quickActions: "クイックアクション",
    viewTasks: "タスクを見る",
    recordAttendance: "出勤打刻",
    viewAttendance: "出勤簿を見る",
    recentActivity: "最近のアクティビティ",
  },

  // Tasks
  tasks: {
    title: "タスク一覧",
    subtitle: "タスクの管理と進捗の追跡",
    createTask: "タスクを作成",
    editTask: "タスクを編集",
    deleteTask: "タスクを削除",
    taskTitle: "タイトル",
    taskDescription: "説明",
    status: "ステータス",
    all: "すべて",
    pending: "未着手",
    inProgress: "進行中",
    completed: "完了",
    noTasks: "タスクがありません",
    noTasksDescription: "最初のタスクを作成して、やることを管理しましょう。",
    confirmDelete: "タスクを削除しますか？",
    confirmDeleteMessage:
      "この操作は取り消せません。タスクを完全に削除します。",
    createdAt: "作成日時",
    updatedAt: "更新日時",
    titleRequired: "タイトルは必須です",
    titlePlaceholder: "タスクのタイトルを入力",
    descriptionPlaceholder: "タスクの説明を入力（任意）",
  },

  // Task detail
  taskDetail: {
    title: "タスク詳細",
    backToList: "一覧に戻る",
    statusLabel: "ステータス",
    descriptionLabel: "説明",
    noDescription: "説明はありません",
    createdAtLabel: "作成日時",
    updatedAtLabel: "更新日時",
  },

  // Stamp (Attendance)
  stamp: {
    title: "勤怠打刻",
    subtitle: "出勤・退勤・休憩の打刻管理",
    clockIn: "出勤",
    clockOut: "退勤",
    breakStart: "休憩開始",
    breakEnd: "休憩終了",
    status: {
      notStarted: "未出勤",
      working: "勤務中",
      onBreak: "休憩中",
      finished: "退勤済み",
    },
    todayRecord: "本日の記録",
    noRecord: "本日の打刻記録はありません",
    workingTime: "勤務時間",
    breakTime: "休憩時間",
  },

  // Language
  language: {
    label: "言語",
    japanese: "日本語",
    english: "English",
  },

  // Errors
  errors: {
    networkError: "ネットワークエラーが発生しました",
    serverError: "サーバーエラーが発生しました",
    notFound: "見つかりませんでした",
    unauthorized: "認証が必要です",
    validationError: "入力内容を確認してください",
    unknownError: "予期しないエラーが発生しました",
  },

  // Accessibility
  a11y: {
    skipToContent: "本文へスキップ",
    currentPage: "現在のページ",
    externalLink: "外部リンク",
    required: "必須",
  },

  // Attendance (出勤簿)
  attendance: {
    title: "出勤簿",
    subtitle: "勤怠記録の確認",
    list: "出勤簿一覧",
    detail: "出勤詳細",
    backToList: "一覧に戻る",
    // Date/Period
    date: "日付",
    month: "月",
    today: "今日",
    thisMonth: "今月",
    // Time labels
    clockIn: "出勤時刻",
    clockOut: "退勤時刻",
    breakStart: "休憩開始",
    breakEnd: "休憩終了",
    // Time types
    workTime: "実労働時間",
    breakTime: "休憩時間",
    overtimeMinutes: "残業時間",
    lateNightMinutes: "深夜残業",
    statutoryOvertimeMinutes: "法定外残業",
    // Summary
    summary: "期間サマリー",
    workDays: "勤務日数",
    totalWorkTime: "総労働時間",
    totalOvertime: "総残業時間",
    totalLateNight: "総深夜残業",
    totalStatutoryOvertime: "総法定外残業",
    // Status
    noRecord: "この期間の記録はありません",
    holiday: "休日",
    // Units
    hours: "時間",
    minutes: "分",
    days: "日",
    // Timeline
    timeline: "出退勤タイムライン",
    workBreakdown: "勤務時間の内訳",
  },
};
