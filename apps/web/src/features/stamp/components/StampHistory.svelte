<script lang="ts">
import type { Stamp } from "../types";

export let stamp: Stamp | null;

type HistoryEntry = {
  label: string;
  time: string;
  icon: string;
};

function formatTime(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

$: stampHistory = buildHistory(stamp);

function buildHistory(stamp: Stamp | null): HistoryEntry[] {
  if (!stamp) return [];

  const entries: HistoryEntry[] = [];

  entries.push({
    label: "出勤",
    time: formatTime(stamp.clockInAt),
    icon: "🟢",
  });

  if (stamp.breakStartAt) {
    entries.push({
      label: "休憩開始",
      time: formatTime(stamp.breakStartAt),
      icon: "☕",
    });
  }

  if (stamp.breakEndAt) {
    entries.push({
      label: "休憩終了",
      time: formatTime(stamp.breakEndAt),
      icon: "💼",
    });
  }

  if (stamp.clockOutAt) {
    entries.push({
      label: "退勤",
      time: formatTime(stamp.clockOutAt),
      icon: "🌙",
    });
  }

  return entries;
}
</script>

<div class="mt-8">
  <h3 class="text-lg font-semibold text-foreground mb-4">本日の打刻履歴</h3>

  {#if stampHistory.length === 0}
    <p class="text-muted-foreground text-center py-6">
      本日の打刻はありません
    </p>
  {:else}
    <div class="space-y-3">
      {#each stampHistory as entry}
        <div
          class="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl" aria-hidden="true">{entry.icon}</span>
            <span class="font-medium">{entry.label}</span>
          </div>
          <time class="font-mono text-muted-foreground">{entry.time}</time>
        </div>
      {/each}
    </div>
  {/if}
</div>
