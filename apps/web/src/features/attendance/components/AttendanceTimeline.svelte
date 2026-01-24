<script lang="ts">
import { t } from "$lib/i18n";
import type { AttendanceRecord } from "../types";
import { formatTime } from "../utils";

interface Props {
  record: AttendanceRecord;
}

let { record }: Props = $props();

type TimelineEntry = {
  label: string;
  time: string;
  icon: string;
};

const entries = $derived.by(() => {
  const result: TimelineEntry[] = [
    {
      label: $t.attendance.clockIn,
      time: formatTime(record.clockInAt),
      icon: "🟢",
    },
  ];

  if (record.breakStartAt) {
    result.push({
      label: $t.attendance.breakStart,
      time: formatTime(record.breakStartAt),
      icon: "☕",
    });
  }

  if (record.breakEndAt) {
    result.push({
      label: $t.attendance.breakEnd,
      time: formatTime(record.breakEndAt),
      icon: "💼",
    });
  }

  if (record.clockOutAt) {
    result.push({
      label: $t.attendance.clockOut,
      time: formatTime(record.clockOutAt),
      icon: "🌙",
    });
  }

  return result;
});
</script>

<section
  class="p-4 sm:p-6 bg-card rounded-xl border shadow-sm"
  aria-labelledby="timeline-title"
>
  <h3 id="timeline-title" class="text-lg font-semibold mb-4">
    {$t.attendance.timeline}
  </h3>

  <div class="relative">
    {#each entries as entry, i (i)}
      <div class="flex items-start gap-4 pb-4 last:pb-0">
        <!-- Icon -->
        <div class="flex-shrink-0 relative">
          <span class="text-2xl" aria-hidden="true">{entry.icon}</span>
          <!-- Connecting line -->
          {#if i < entries.length - 1}
            <div
              class="absolute left-1/2 top-8 w-0.5 h-8 bg-muted-foreground/30 -translate-x-1/2"
            ></div>
          {/if}
        </div>

        <!-- Content -->
        <div class="flex-1 flex justify-between items-center pt-1">
          <span class="font-medium text-foreground">{entry.label}</span>
          <time class="font-mono text-lg tabular-nums text-muted-foreground">
            {entry.time}
          </time>
        </div>
      </div>
    {/each}
  </div>
</section>
