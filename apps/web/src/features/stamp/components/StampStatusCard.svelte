<script lang="ts">
import type { Stamp, WorkStatus } from "../types";

export let status: WorkStatus;
export let stamp: Stamp | null;

const statusConfig: Record<
  WorkStatus,
  { label: string; bgColor: string; textColor: string; icon: string }
> = {
  not_working: {
    label: "未出勤",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-700 dark:text-gray-300",
    icon: "🏠",
  },
  working: {
    label: "勤務中",
    bgColor: "bg-green-100 dark:bg-green-900",
    textColor: "text-green-700 dark:text-green-300",
    icon: "💼",
  },
  on_break: {
    label: "休憩中",
    bgColor: "bg-orange-100 dark:bg-orange-900",
    textColor: "text-orange-700 dark:text-orange-300",
    icon: "☕",
  },
  clocked_out: {
    label: "退勤済み",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    textColor: "text-blue-700 dark:text-blue-300",
    icon: "🌙",
  },
};

$: config = statusConfig[status];

function formatTime(date: Date | string | null): string {
  if (!date) return "--:--";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<div
  class="p-6 sm:p-8 rounded-2xl {config.bgColor} transition-colors"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <div class="text-center">
    <div class="text-5xl sm:text-6xl mb-3" aria-hidden="true">
      {config.icon}
    </div>
    <h2 class="text-2xl sm:text-3xl font-bold {config.textColor}">
      {config.label}
    </h2>
  </div>

  {#if stamp}
    <div class="mt-6 space-y-2 text-sm sm:text-base {config.textColor}">
      <div class="flex justify-between items-center">
        <span>出勤</span>
        <span class="font-mono font-medium">{formatTime(stamp.clockInAt)}</span>
      </div>

      {#if stamp.breakStartAt}
        <div class="flex justify-between items-center">
          <span>休憩開始</span>
          <span class="font-mono font-medium"
            >{formatTime(stamp.breakStartAt)}</span
          >
        </div>
      {/if}

      {#if stamp.breakEndAt}
        <div class="flex justify-between items-center">
          <span>休憩終了</span>
          <span class="font-mono font-medium"
            >{formatTime(stamp.breakEndAt)}</span
          >
        </div>
      {/if}

      {#if stamp.clockOutAt}
        <div class="flex justify-between items-center">
          <span>退勤</span>
          <span class="font-mono font-medium"
            >{formatTime(stamp.clockOutAt)}</span
          >
        </div>
      {/if}
    </div>
  {/if}
</div>
