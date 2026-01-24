# 出勤簿（Attendance）UI/UX デザイン設計書

## 1. 概要

### 1.1 目的

stampデータを元に計算された勤怠情報（出勤時間、退勤時刻、休憩時間、残業時間、深夜残業時間、法定外残業時間）を表示する出勤簿画面を設計します。

### 1.2 機能要件

- **一覧画面**: 期間指定で複数日の出勤記録を表示
- **詳細画面**: 特定の日の出退勤詳細を表示
- **サマリー表示**: 合計勤務時間、残業時間などの集計

### 1.3 APIエンドポイント

```
GET /api/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD  # 一覧取得
GET /api/attendance/:date                          # 日付指定詳細
```

### 1.4 表示項目

| 項目 | 説明 | APIフィールド |
|------|------|--------------|
| 出勤時刻 | 出勤打刻時間 | `clockInAt` |
| 退勤時刻 | 退勤打刻時間 | `clockOutAt` |
| 休憩時間 | 休憩の合計時間（分） | `breakMinutes` |
| 実労働時間 | 勤務時間 - 休憩時間（分） | `workMinutes` |
| 残業時間 | 8時間超過分（分） | `overtimeMinutes` |
| 深夜残業時間 | 22:00-05:00の労働時間（分） | `lateNightMinutes` |
| 法定外残業時間 | 週40時間超過分（分） | `statutoryOvertimeMinutes` |

---

## 2. 画面構成

### 2.1 画面一覧

| 画面名 | パス | 説明 |
|--------|------|------|
| 出勤簿一覧 | `/attendance` | 月間/期間の出勤記録リスト |
| 出勤簿詳細 | `/attendance/:date` | 特定日の詳細表示 |

### 2.2 ファイル構成

```
apps/web/src/features/attendance/
├── pages/
│   ├── AttendancePage.svelte          # 一覧ページ
│   ├── AttendanceDetailPage.svelte    # 詳細ページ
│   └── index.ts
├── components/
│   ├── AttendanceHeader.svelte        # ページヘッダー
│   ├── AttendanceTable.svelte         # テーブル表示（デスクトップ）
│   ├── AttendanceCard.svelte          # カード表示（モバイル）
│   ├── AttendanceSummaryCard.svelte   # 期間サマリー
│   ├── AttendanceDetailCard.svelte    # 詳細カード
│   ├── AttendanceTimeline.svelte      # 出退勤タイムライン
│   ├── MonthSelector.svelte           # 月選択
│   └── index.ts
├── api/
│   ├── client.ts                      # Hono RPCクライアント
│   └── index.ts                       # APIラッパー関数
├── stores/
│   ├── attendance.ts                  # Svelte store
│   └── index.ts
├── types/
│   └── index.ts                       # 型定義
└── .docs/
    └── design.md                      # このファイル
```

---

## 3. ワイヤーフレーム

### 3.1 一覧画面（AttendancePage）

```
┌─────────────────────────────────────────────────────┐
│  出勤簿                                             │
│  勤怠記録の確認                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [<] 2026年1月 [>]  [今月]                          │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │  期間サマリー                                │   │
│  │                                             │   │
│  │  勤務日数    総労働時間    総残業時間        │   │
│  │    15日       120h 30m      10h 30m         │   │
│  │                                             │   │
│  │  深夜残業    法定外残業                      │   │
│  │    2h 00m      8h 30m                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Desktop: テーブル表示                              │
│                                                     │
│  日付      │ 出勤  │ 退勤  │ 休憩  │ 労働   │ 残業 │
│  ─────────┼───────┼───────┼───────┼────────┼──────│
│  1/15(水) │ 09:00 │ 18:30 │ 1:00  │ 8:30   │ 0:30 │
│  1/14(火) │ 09:00 │ 18:00 │ 1:00  │ 8:00   │ 0:00 │
│  1/13(月) │ 09:00 │ 20:00 │ 1:00  │ 10:00  │ 2:00 │
│  ...                                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Mobile: カードリスト表示                           │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  1月15日（水）              [8h30m]         │   │
│  │  09:00 - 18:30                              │   │
│  │  休憩: 1h │ 残業: 30m                       │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  1月14日（火）              [8h00m]         │   │
│  │  09:00 - 18:00                              │   │
│  │  休憩: 1h │ 残業: 0m                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 3.2 詳細画面（AttendanceDetailPage）

```
┌─────────────────────────────────────────────────────┐
│  [← 一覧に戻る]                                     │
│                                                     │
│  2026年1月15日（水）                                │
│  出勤詳細                                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  出退勤タイムライン                          │   │
│  │                                             │   │
│  │  🟢 出勤時刻        09:00:00               │   │
│  │  │                                          │   │
│  │  ☕ 休憩開始        12:00:00               │   │
│  │  │                                          │   │
│  │  💼 休憩終了        13:00:00               │   │
│  │  │                                          │   │
│  │  🌙 退勤時刻        18:30:00               │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  勤務時間の内訳                              │   │
│  │                                             │   │
│  │  実労働時間                    8時間30分    │   │
│  │  ──────────────────────────────────────    │   │
│  │  休憩時間                      1時間00分    │   │
│  │  ──────────────────────────────────────    │   │
│  │  残業時間                      0時間30分    │   │
│  │  ──────────────────────────────────────    │   │
│  │  深夜残業時間                  0時間00分    │   │
│  │  ──────────────────────────────────────    │   │
│  │  法定外残業時間                0時間30分    │   │
│  │                                             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 4. デザイン仕様

### 4.1 カラーシステム

#### 勤務状態の色分け

| 状態 | 背景色 | テキスト色 | 使用場面 |
|------|--------|-----------|---------|
| 通常勤務 | `bg-green-100` | `text-green-700` | 8時間以内 |
| 残業あり | `bg-orange-100` | `text-orange-700` | 8-10時間 |
| 長時間勤務 | `bg-red-100` | `text-red-700` | 10時間超 |
| 休日/データなし | `bg-gray-100` | `text-gray-500` | 記録なし |
| 深夜残業あり | `bg-purple-100` | `text-purple-700` | 深夜勤務 |

#### アイコンと意味

| アイコン | 意味 | 使用場面 |
|---------|------|---------|
| 🟢 | 出勤 | タイムライン |
| 🌙 | 退勤 | タイムライン |
| ☕ | 休憩開始 | タイムライン |
| 💼 | 休憩終了/勤務中 | タイムライン |
| ⏱️ | 労働時間 | サマリー |
| 🌃 | 深夜残業 | サマリー |

### 4.2 タイポグラフィ

```svelte
<!-- ページタイトル -->
<h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
  出勤簿
</h1>

<!-- 月表示 -->
<h2 class="text-xl sm:text-2xl font-semibold text-foreground">
  2026年1月
</h2>

<!-- セクションタイトル -->
<h3 class="text-lg font-semibold text-foreground">
  期間サマリー
</h3>

<!-- 時刻表示 -->
<time class="font-mono text-base sm:text-lg tabular-nums">
  09:00:00
</time>

<!-- ラベル -->
<span class="text-sm text-muted-foreground">
  実労働時間
</span>

<!-- 値（数値） -->
<span class="text-base sm:text-lg font-semibold tabular-nums">
  8時間30分
</span>
```

### 4.3 スペーシング

8pxグリッドシステムに準拠:

```svelte
<!-- ページコンテナ -->
<div class="py-4 sm:py-6 lg:py-8 max-w-4xl mx-auto px-4 sm:px-6">

<!-- セクション間 -->
<section class="mt-6 sm:mt-8">

<!-- カード内パディング -->
<div class="p-4 sm:p-6">

<!-- 要素間ギャップ -->
<div class="space-y-4 sm:space-y-6">
```

### 4.4 レスポンシブ戦略

| ブレークポイント | レイアウト | 表示内容 |
|-----------------|-----------|---------|
| ~640px (mobile) | カードリスト | 日付、出退勤時刻、労働時間、休憩、残業 |
| 640px~ (sm) | テーブル | 基本列（日付、出勤、退勤、休憩、労働時間、残業） |
| 1024px~ (lg) | テーブル（拡張） | + 深夜残業列 |
| 1280px~ (xl) | テーブル（全列） | + 法定外残業列 |

---

## 5. コンポーネント設計

### 5.1 AttendanceTable.svelte

```svelte
<script lang="ts">
  import type { AttendanceRecord } from "../types";
  import { t, locale } from "$lib/i18n";
  import { formatMinutesToDuration } from "../utils";

  export let records: AttendanceRecord[];
  export let onSelectDate: (date: string) => void;
</script>

<div class="overflow-x-auto">
  <table class="w-full text-sm" role="grid" aria-label={$t.attendance.list}>
    <thead class="bg-muted/50">
      <tr>
        <th class="text-left p-3 font-medium">{$t.attendance.date}</th>
        <th class="text-center p-3 font-medium">{$t.attendance.clockIn}</th>
        <th class="text-center p-3 font-medium">{$t.attendance.clockOut}</th>
        <th class="text-center p-3 font-medium hidden sm:table-cell">
          {$t.attendance.breakTime}
        </th>
        <th class="text-center p-3 font-medium">{$t.attendance.workTime}</th>
        <th class="text-center p-3 font-medium hidden lg:table-cell">
          {$t.attendance.overtimeMinutes}
        </th>
        <th class="text-center p-3 font-medium hidden xl:table-cell">
          {$t.attendance.lateNightMinutes}
        </th>
      </tr>
    </thead>
    <tbody class="divide-y divide-border">
      {#each records as record (record.id)}
        <tr
          role="row"
          tabindex="0"
          class="hover:bg-muted/30 cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          onclick={() => onSelectDate(record.date)}
          onkeydown={(e) => e.key === "Enter" && onSelectDate(record.date)}
        >
          <!-- 列の内容 -->
        </tr>
      {/each}
    </tbody>
  </table>
</div>
```

### 5.2 AttendanceCard.svelte

モバイル用のカード表示:

```svelte
<script lang="ts">
  import type { AttendanceRecord } from "../types";
  import { Badge } from "$lib/components/ui/badge";
  import { t } from "$lib/i18n";
  import { formatDateWithWeekday, formatMinutesToDuration, formatTime } from "../utils";
  import { getWorkStatusVariant } from "../utils";

  export let record: AttendanceRecord;
  export let onclick: () => void;
</script>

<button
  type="button"
  class="w-full text-left p-4 bg-card rounded-lg shadow-sm border hover:shadow-md transition-shadow active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
  {onclick}
>
  <div class="flex justify-between items-start mb-3">
    <div>
      <p class="font-semibold text-foreground">
        {formatDateWithWeekday(record.date)}
      </p>
      <p class="text-sm text-muted-foreground">
        {formatTime(record.clockInAt)} - {record.clockOutAt ? formatTime(record.clockOutAt) : "--:--"}
      </p>
    </div>
    <Badge variant={getWorkStatusVariant(record.workMinutes)}>
      {formatMinutesToDuration(record.workMinutes)}
    </Badge>
  </div>
  <div class="grid grid-cols-2 gap-2 text-sm">
    <div>
      <span class="text-muted-foreground">{$t.attendance.breakTime}:</span>
      <span class="ml-1 font-medium">{formatMinutesToDuration(record.breakMinutes)}</span>
    </div>
    <div>
      <span class="text-muted-foreground">{$t.attendance.overtimeMinutes}:</span>
      <span class="ml-1 font-medium">{formatMinutesToDuration(record.overtimeMinutes)}</span>
    </div>
  </div>
</button>
```

### 5.3 AttendanceSummaryCard.svelte

期間サマリー表示:

```svelte
<script lang="ts">
  import type { AttendanceSummary } from "../types";
  import { t } from "$lib/i18n";
  import { formatMinutesToDuration } from "../utils";

  export let summary: AttendanceSummary;
</script>

<section
  class="p-4 sm:p-6 bg-card rounded-xl border shadow-sm"
  aria-labelledby="summary-title"
>
  <h3 id="summary-title" class="text-lg font-semibold mb-4">
    {$t.attendance.summary}
  </h3>

  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
    <!-- 勤務日数 -->
    <div class="text-center p-3 bg-muted/50 rounded-lg">
      <p class="text-sm text-muted-foreground">{$t.attendance.workDays}</p>
      <p class="text-2xl font-bold tabular-nums mt-1">
        {summary.workDays}<span class="text-sm font-normal ml-1">{$t.attendance.days}</span>
      </p>
    </div>

    <!-- 総労働時間 -->
    <div class="text-center p-3 bg-muted/50 rounded-lg">
      <p class="text-sm text-muted-foreground">{$t.attendance.totalWorkTime}</p>
      <p class="text-2xl font-bold tabular-nums mt-1">
        {formatMinutesToDuration(summary.totalWorkMinutes)}
      </p>
    </div>

    <!-- 総残業時間 -->
    <div class="text-center p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
      <p class="text-sm text-orange-700 dark:text-orange-300">{$t.attendance.totalOvertime}</p>
      <p class="text-2xl font-bold tabular-nums mt-1 text-orange-700 dark:text-orange-300">
        {formatMinutesToDuration(summary.totalOvertimeMinutes)}
      </p>
    </div>

    <!-- 深夜残業 -->
    <div class="text-center p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
      <p class="text-sm text-purple-700 dark:text-purple-300">{$t.attendance.totalLateNight}</p>
      <p class="text-2xl font-bold tabular-nums mt-1 text-purple-700 dark:text-purple-300">
        {formatMinutesToDuration(summary.totalLateNightMinutes)}
      </p>
    </div>

    <!-- 法定外残業 -->
    <div class="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
      <p class="text-sm text-red-700 dark:text-red-300">{$t.attendance.totalStatutoryOvertime}</p>
      <p class="text-2xl font-bold tabular-nums mt-1 text-red-700 dark:text-red-300">
        {formatMinutesToDuration(summary.totalStatutoryOvertimeMinutes)}
      </p>
    </div>
  </div>
</section>
```

### 5.4 MonthSelector.svelte

月選択コンポーネント:

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { t, locale } from "$lib/i18n";
  import ChevronLeft from "lucide-svelte/icons/chevron-left";
  import ChevronRight from "lucide-svelte/icons/chevron-right";

  export let year: number;
  export let month: number; // 1-12
  export let onPrevMonth: () => void;
  export let onNextMonth: () => void;
  export let onThisMonth: () => void;

  $: monthLabel = new Date(year, month - 1).toLocaleDateString(
    $locale === "ja" ? "ja-JP" : "en-US",
    { year: "numeric", month: "long" }
  );
</script>

<div class="flex items-center gap-2 sm:gap-4">
  <Button
    variant="ghost"
    size="icon"
    onclick={onPrevMonth}
    aria-label="前の月"
    class="min-h-[44px] min-w-[44px]"
  >
    <ChevronLeft class="h-5 w-5" />
  </Button>

  <span class="text-lg sm:text-xl font-semibold min-w-[140px] sm:min-w-[160px] text-center">
    {monthLabel}
  </span>

  <Button
    variant="ghost"
    size="icon"
    onclick={onNextMonth}
    aria-label="次の月"
    class="min-h-[44px] min-w-[44px]"
  >
    <ChevronRight class="h-5 w-5" />
  </Button>

  <Button
    variant="outline"
    size="sm"
    onclick={onThisMonth}
    class="min-h-[44px] px-4"
  >
    {$t.attendance.thisMonth}
  </Button>
</div>
```

### 5.5 AttendanceTimeline.svelte

詳細画面の出退勤タイムライン:

```svelte
<script lang="ts">
  import type { AttendanceRecord } from "../types";
  import { t } from "$lib/i18n";
  import { formatTime } from "../utils";

  export let record: AttendanceRecord;

  type TimelineEntry = {
    label: string;
    time: string | null;
    icon: string;
  };

  $: entries = buildTimeline(record);

  function buildTimeline(record: AttendanceRecord): TimelineEntry[] {
    const entries: TimelineEntry[] = [
      { label: $t.attendance.clockIn, time: formatTime(record.clockInAt), icon: "🟢" },
    ];

    if (record.breakStartAt) {
      entries.push({ label: $t.attendance.breakStart, time: formatTime(record.breakStartAt), icon: "☕" });
    }

    if (record.breakEndAt) {
      entries.push({ label: $t.attendance.breakEnd, time: formatTime(record.breakEndAt), icon: "💼" });
    }

    if (record.clockOutAt) {
      entries.push({ label: $t.attendance.clockOut, time: formatTime(record.clockOutAt), icon: "🌙" });
    }

    return entries;
  }
</script>

<div class="space-y-0">
  {#each entries as entry, i (i)}
    <div class="flex items-center gap-4 p-3 {i < entries.length - 1 ? 'border-l-2 border-muted ml-[18px] pl-7' : ''}">
      <span class="text-2xl flex-shrink-0 {i > 0 ? '-ml-10' : ''}" aria-hidden="true">
        {entry.icon}
      </span>
      <div class="flex-1 flex justify-between items-center">
        <span class="font-medium">{entry.label}</span>
        <time class="font-mono text-lg tabular-nums">{entry.time ?? "--:--:--"}</time>
      </div>
    </div>
  {/each}
</div>
```

---

## 6. 状態管理

### 6.1 Store設計（stores/attendance.ts）

```typescript
import { writable, derived } from "svelte/store";
import * as api from "../api";
import type { AttendanceRecord, AttendanceSummary } from "../types";

// State
export const records = writable<AttendanceRecord[]>([]);
export const summary = writable<AttendanceSummary | null>(null);
export const selectedRecord = writable<AttendanceRecord | null>(null);
export const isLoading = writable<boolean>(false);
export const error = writable<string | null>(null);

// 現在選択中の年月
export const selectedYear = writable<number>(new Date().getFullYear());
export const selectedMonth = writable<number>(new Date().getMonth() + 1);

// Derived: 期間の開始日と終了日
export const dateRange = derived(
  [selectedYear, selectedMonth],
  ([$year, $month]) => {
    const from = `${$year}-${String($month).padStart(2, "0")}-01`;
    const lastDay = new Date($year, $month, 0).getDate();
    const to = `${$year}-${String($month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { from, to };
  }
);

// Actions
export const attendanceStore = {
  async fetchByDateRange(from: string, to: string): Promise<void> {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.getAttendanceByDateRange(from, to);
      records.set(data.records);
      summary.set(data.summary);
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to fetch attendance");
    } finally {
      isLoading.set(false);
    }
  },

  async fetchByDate(date: string): Promise<void> {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.getAttendanceByDate(date);
      selectedRecord.set(data.record);
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to fetch attendance");
    } finally {
      isLoading.set(false);
    }
  },

  prevMonth(): void {
    selectedMonth.update((m) => {
      if (m === 1) {
        selectedYear.update((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  },

  nextMonth(): void {
    selectedMonth.update((m) => {
      if (m === 12) {
        selectedYear.update((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  },

  goToThisMonth(): void {
    const now = new Date();
    selectedYear.set(now.getFullYear());
    selectedMonth.set(now.getMonth() + 1);
  },

  clear(): void {
    records.set([]);
    summary.set(null);
    selectedRecord.set(null);
    error.set(null);
    isLoading.set(false);
  },
};
```

---

## 7. インタラクション設計

### 7.1 ユーザーフロー

```
[出勤簿一覧] ─────────────────────────────────────────┐
    │                                                  │
    ├── 月選択 [<] [2026年1月] [>] [今月]             │
    │       │                                          │
    │       └── 月変更 → APIフェッチ → リスト更新      │
    │                                                  │
    ├── サマリーカード表示                             │
    │                                                  │
    └── 日付行クリック ─────────────────────────┐     │
                                                 │     │
                                                 ▼     │
                                        [出勤簿詳細]   │
                                             │        │
                                             ├── タイムライン表示
                                             │
                                             ├── 勤務時間内訳表示
                                             │
                                             └── [← 一覧に戻る] ──────┘
```

### 7.2 キーボード操作

| キー | コンテキスト | アクション |
|------|-------------|-----------|
| Tab | 全体 | フォーカス移動 |
| Enter | テーブル行 | 詳細画面へ遷移 |
| ← | 月セレクター（フォーカス時） | 前月へ |
| → | 月セレクター（フォーカス時） | 翌月へ |
| Escape | 詳細画面 | 一覧に戻る |

### 7.3 ローディング状態

```svelte
{#if $isLoading}
  <!-- スケルトンローディング -->
  <div class="space-y-3" role="status" aria-label="読み込み中">
    {#each Array(5) as _}
      <div class="animate-pulse">
        <div class="h-16 bg-muted rounded-lg"></div>
      </div>
    {/each}
    <span class="sr-only">読み込み中...</span>
  </div>
{:else if $error}
  <!-- エラー表示 -->
  <div
    class="bg-destructive/15 border border-destructive text-destructive-foreground p-4 rounded-lg"
    role="alert"
  >
    <p class="font-medium">{$t.common.error}</p>
    <p class="mt-1 text-sm">{$error}</p>
  </div>
{:else if $records.length === 0}
  <!-- 空状態 -->
  <div class="text-center py-12">
    <p class="text-muted-foreground">{$t.attendance.noRecord}</p>
  </div>
{:else}
  <!-- コンテンツ -->
{/if}
```

---

## 8. アクセシビリティ

### 8.1 ARIA属性

```svelte
<!-- テーブル -->
<table role="grid" aria-label={$t.attendance.list}>
  <caption class="sr-only">
    {monthLabel}の出勤記録
  </caption>
</table>

<!-- 行（クリック可能） -->
<tr
  role="row"
  tabindex="0"
  aria-label="{formatDate(record.date)}の出勤詳細を表示"
>

<!-- サマリーセクション -->
<section aria-labelledby="summary-title">
  <h3 id="summary-title">{$t.attendance.summary}</h3>
</section>

<!-- 時刻 -->
<time datetime="2026-01-15T09:00:00+09:00">09:00</time>

<!-- ローディング -->
<div role="status" aria-live="polite" aria-busy="true">
  <span class="sr-only">読み込み中...</span>
</div>

<!-- エラー -->
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

### 8.2 フォーカス管理

```svelte
<script lang="ts">
  import { onMount } from "svelte";

  let firstFocusableElement: HTMLElement;

  onMount(() => {
    // ページ遷移時に最初のフォーカス可能要素にフォーカス
    firstFocusableElement?.focus();
  });
</script>
```

### 8.3 カラーコントラスト

すべてのテキストはWCAG 2.1 AA基準を満たす:
- 通常テキスト: 4.5:1以上
- 大きいテキスト（18px以上または14px太字）: 3:1以上

使用するTailwindクラス:
- `text-foreground` / `text-muted-foreground` - 十分なコントラスト
- `text-green-700` / `text-orange-700` / `text-red-700` - セマンティックカラー

---

## 9. i18n対応

### 9.1 翻訳キー追加（types.ts）

```typescript
// Attendance (出勤簿) を Translations interface に追加
attendance: {
  title: string;
  subtitle: string;
  list: string;
  detail: string;
  backToList: string;
  // 日付・期間
  date: string;
  month: string;
  today: string;
  thisMonth: string;
  // 時刻ラベル
  clockIn: string;
  clockOut: string;
  breakStart: string;
  breakEnd: string;
  // 時間種別
  workTime: string;
  breakTime: string;
  overtimeMinutes: string;
  lateNightMinutes: string;
  statutoryOvertimeMinutes: string;
  // サマリー
  summary: string;
  workDays: string;
  totalWorkTime: string;
  totalOvertime: string;
  totalLateNight: string;
  totalStatutoryOvertime: string;
  // 状態
  noRecord: string;
  holiday: string;
  // 単位
  hours: string;
  minutes: string;
  days: string;
};
```

### 9.2 日本語翻訳（ja.ts）

```typescript
attendance: {
  title: "出勤簿",
  subtitle: "勤怠記録の確認",
  list: "出勤簿一覧",
  detail: "出勤詳細",
  backToList: "一覧に戻る",
  // 日付・期間
  date: "日付",
  month: "月",
  today: "今日",
  thisMonth: "今月",
  // 時刻ラベル
  clockIn: "出勤時刻",
  clockOut: "退勤時刻",
  breakStart: "休憩開始",
  breakEnd: "休憩終了",
  // 時間種別
  workTime: "実労働時間",
  breakTime: "休憩時間",
  overtimeMinutes: "残業時間",
  lateNightMinutes: "深夜残業",
  statutoryOvertimeMinutes: "法定外残業",
  // サマリー
  summary: "期間サマリー",
  workDays: "勤務日数",
  totalWorkTime: "総労働時間",
  totalOvertime: "総残業時間",
  totalLateNight: "総深夜残業",
  totalStatutoryOvertime: "総法定外残業",
  // 状態
  noRecord: "この期間の記録はありません",
  holiday: "休日",
  // 単位
  hours: "時間",
  minutes: "分",
  days: "日",
},
```

### 9.3 英語翻訳（en.ts）

```typescript
attendance: {
  title: "Attendance",
  subtitle: "View attendance records",
  list: "Attendance List",
  detail: "Attendance Detail",
  backToList: "Back to list",
  // Date/Period
  date: "Date",
  month: "Month",
  today: "Today",
  thisMonth: "This Month",
  // Time labels
  clockIn: "Clock In",
  clockOut: "Clock Out",
  breakStart: "Break Start",
  breakEnd: "Break End",
  // Time types
  workTime: "Work Time",
  breakTime: "Break Time",
  overtimeMinutes: "Overtime",
  lateNightMinutes: "Late Night",
  statutoryOvertimeMinutes: "Statutory OT",
  // Summary
  summary: "Period Summary",
  workDays: "Work Days",
  totalWorkTime: "Total Work",
  totalOvertime: "Total Overtime",
  totalLateNight: "Total Late Night",
  totalStatutoryOvertime: "Total Statutory OT",
  // Status
  noRecord: "No records for this period",
  holiday: "Holiday",
  // Units
  hours: "hours",
  minutes: "min",
  days: "days",
},
```

---

## 10. ユーティリティ関数

### 10.1 時間フォーマット（utils/index.ts）

```typescript
/**
 * 分を「X時間Y分」または「Xh Ym」形式でフォーマット
 */
export function formatMinutesToDuration(
  minutes: number,
  locale: string = "ja"
): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (locale === "ja") {
    if (hours === 0) return `${mins}分`;
    if (mins === 0) return `${hours}時間`;
    return `${hours}時間${mins}分`;
  }

  // English
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * 分を「HH:MM」形式でフォーマット
 */
export function formatMinutesToHHMM(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${String(mins).padStart(2, "0")}`;
}

/**
 * ISO日付文字列を曜日付きでフォーマット
 * 例: "1月15日（水）" or "Jan 15 (Wed)"
 */
export function formatDateWithWeekday(
  dateStr: string,
  locale: string = "ja"
): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    month: locale === "ja" ? "numeric" : "short",
    day: "numeric",
    weekday: "short",
  };
  return date.toLocaleDateString(
    locale === "ja" ? "ja-JP" : "en-US",
    options
  );
}

/**
 * Date/文字列を「HH:MM:SS」形式でフォーマット
 */
export function formatTime(date: Date | string | null): string {
  if (!date) return "--:--:--";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Date/文字列を「HH:MM」形式でフォーマット（秒なし）
 */
export function formatTimeShort(date: Date | string | null): string {
  if (!date) return "--:--";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 労働時間に基づいてBadgeのvariantを返す
 */
export function getWorkStatusVariant(
  workMinutes: number
): "default" | "secondary" | "destructive" | "outline" {
  if (workMinutes === 0) return "outline"; // データなし
  if (workMinutes <= 480) return "default"; // 8時間以内（正常）
  if (workMinutes <= 600) return "secondary"; // 10時間以内（残業あり）
  return "destructive"; // 10時間超（長時間勤務）
}
```

---

## 11. 実装チェックリスト

### Phase 1: 基盤（優先度: 高）

- [ ] `types/index.ts` - 型定義
- [ ] `api/client.ts` - Hono RPCクライアント設定
- [ ] `api/index.ts` - APIラッパー関数
- [ ] `stores/attendance.ts` - Svelte store
- [ ] `stores/index.ts` - エクスポート
- [ ] i18n翻訳キー追加（types.ts, ja.ts, en.ts）

### Phase 2: 一覧画面（優先度: 高）

- [ ] `components/AttendanceHeader.svelte`
- [ ] `components/MonthSelector.svelte`
- [ ] `components/AttendanceSummaryCard.svelte`
- [ ] `components/AttendanceTable.svelte`（デスクトップ）
- [ ] `components/AttendanceCard.svelte`（モバイル）
- [ ] `components/index.ts`
- [ ] `pages/AttendancePage.svelte`
- [ ] `pages/index.ts`

### Phase 3: 詳細画面（優先度: 中）

- [ ] `components/AttendanceTimeline.svelte`
- [ ] `components/AttendanceDetailCard.svelte`
- [ ] `pages/AttendanceDetailPage.svelte`

### Phase 4: ルーティング・ナビゲーション（優先度: 中）

- [ ] App.svelteにルート追加
- [ ] サイドバー（AppSidebar.svelte）にナビ追加
- [ ] ナビゲーションi18nキー追加

### Phase 5: テスト・QA（優先度: 低）

- [ ] レスポンシブテスト（320px, 640px, 1024px, 1280px）
- [ ] キーボード操作テスト
- [ ] スクリーンリーダーテスト
- [ ] カラーコントラストチェック
- [ ] ローディング・エラー状態テスト

---

## 12. デザインチェックリスト

### レスポンシブ

- [x] モバイルファースト設計（base → sm: → md: → lg:）
- [x] カード/テーブル切り替え
- [x] タッチターゲット 44×44px以上
- [x] レスポンシブタイポグラフィ
- [x] レスポンシブスペーシング

### アクセシビリティ

- [x] セマンティックHTML（table, time, section, nav）
- [x] ARIA属性（role, aria-label, aria-live）
- [x] キーボード操作対応
- [x] カラーコントラスト WCAG AA準拠
- [x] フォーカス状態の明示
- [x] スクリーンリーダー対応

### UX

- [x] ローディング状態（スケルトン）
- [x] 空状態のメッセージ
- [x] エラーハンドリング
- [x] 月切り替えのスムーズなトランジション
- [x] 行クリックで詳細遷移
- [x] 戻るボタン

### パフォーマンス

- [x] 期間指定による必要データのみ取得
- [x] 適切なキャッシュ戦略
- [ ] 大量データ時の仮想スクロール（将来対応）

### Material Design

- [x] 8pxグリッドシステム
- [x] エレベーション（shadow）の適切な使用
- [x] セマンティックカラー
- [x] 明確なタイポグラフィ階層

---

## 13. 参考資料

- [Material Design 3](https://m3.material.io/)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn-svelte Components](https://www.shadcn-svelte.com/)
- プロジェクト内参照:
  - `/workspace/main/.claude/rules/design-guide.md`
  - `/workspace/main/apps/web/src/features/stamp/` (参考実装)
