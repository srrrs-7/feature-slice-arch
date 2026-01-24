<script lang="ts">
import { locale, t } from "$lib/i18n";
import type { Stamp, WorkStatus } from "../types";

export let status: WorkStatus;
export let stamp: Stamp | null;

type StatusConfig = {
  labelKey: "notStarted" | "working" | "onBreak" | "finished";
  bgColor: string;
  textColor: string;
  icon: string;
};

const statusConfigMap: Record<WorkStatus, StatusConfig> = {
  not_working: {
    labelKey: "notStarted",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-700 dark:text-gray-300",
    icon: "🏠",
  },
  working: {
    labelKey: "working",
    bgColor: "bg-green-100 dark:bg-green-900",
    textColor: "text-green-700 dark:text-green-300",
    icon: "💼",
  },
  on_break: {
    labelKey: "onBreak",
    bgColor: "bg-orange-100 dark:bg-orange-900",
    textColor: "text-orange-700 dark:text-orange-300",
    icon: "☕",
  },
  clocked_out: {
    labelKey: "finished",
    bgColor: "bg-blue-100 dark:bg-blue-900",
    textColor: "text-blue-700 dark:text-blue-300",
    icon: "🌙",
  },
};

$: config = statusConfigMap[status];

function getStatusLabel(
  labelKey: "notStarted" | "working" | "onBreak" | "finished",
): string {
  return $t.stamp.status[labelKey];
}

function formatTime(date: Date | string | null): string {
  if (!date) return "--:--";
  const d = typeof date === "string" ? new Date(date) : date;
  const localeString = $locale === "ja" ? "ja-JP" : "en-US";
  return d.toLocaleTimeString(localeString, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<div
  class="p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl {config.bgColor} transition-colors"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <div class="text-center">
    <div class="text-4xl sm:text-5xl lg:text-6xl mb-2 sm:mb-3" aria-hidden="true">
      {config.icon}
    </div>
    <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold {config.textColor}">
      {getStatusLabel(config.labelKey)}
    </h2>
  </div>

  {#if stamp}
    <div class="mt-4 sm:mt-6 space-y-2 text-sm sm:text-base {config.textColor}">
      <div class="flex justify-between items-center">
        <span>{$t.stamp.clockIn}</span>
        <span class="font-mono font-medium">{formatTime(stamp.clockInAt)}</span>
      </div>

      {#if stamp.breakStartAt}
        <div class="flex justify-between items-center">
          <span>{$t.stamp.breakStart}</span>
          <span class="font-mono font-medium"
            >{formatTime(stamp.breakStartAt)}</span
          >
        </div>
      {/if}

      {#if stamp.breakEndAt}
        <div class="flex justify-between items-center">
          <span>{$t.stamp.breakEnd}</span>
          <span class="font-mono font-medium"
            >{formatTime(stamp.breakEndAt)}</span
          >
        </div>
      {/if}

      {#if stamp.clockOutAt}
        <div class="flex justify-between items-center">
          <span>{$t.stamp.clockOut}</span>
          <span class="font-mono font-medium"
            >{formatTime(stamp.clockOutAt)}</span
          >
        </div>
      {/if}
    </div>
  {/if}
</div>
