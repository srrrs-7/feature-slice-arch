<script lang="ts">
import { locale, t } from "$lib/i18n";
import type { AttendanceRecord } from "../types";
import { formatMinutesToDuration } from "../utils";

interface Props {
  record: AttendanceRecord;
}

let { record }: Props = $props();

type BreakdownItem = {
  label: string;
  value: string;
  colorClass?: string;
};

const breakdownItems = $derived.by((): BreakdownItem[] => [
  {
    label: $t.attendance.workTime,
    value: formatMinutesToDuration(record.workMinutes, $locale),
  },
  {
    label: $t.attendance.breakTime,
    value: formatMinutesToDuration(record.breakMinutes, $locale),
  },
  {
    label: $t.attendance.overtimeMinutes,
    value: formatMinutesToDuration(record.overtimeMinutes, $locale),
    colorClass:
      record.overtimeMinutes > 0
        ? "text-orange-600 dark:text-orange-400"
        : undefined,
  },
  {
    label: $t.attendance.lateNightMinutes,
    value: formatMinutesToDuration(record.lateNightMinutes, $locale),
    colorClass:
      record.lateNightMinutes > 0
        ? "text-purple-600 dark:text-purple-400"
        : undefined,
  },
  {
    label: $t.attendance.statutoryOvertimeMinutes,
    value: formatMinutesToDuration(record.statutoryOvertimeMinutes, $locale),
    colorClass:
      record.statutoryOvertimeMinutes > 0
        ? "text-red-600 dark:text-red-400"
        : undefined,
  },
]);
</script>

<section
  class="p-4 sm:p-6 bg-card rounded-xl border shadow-sm"
  aria-labelledby="breakdown-title"
>
  <h3 id="breakdown-title" class="text-lg font-semibold mb-4">
    {$t.attendance.workBreakdown}
  </h3>

  <div class="space-y-3">
    {#each breakdownItems as item (item.label)}
      <div class="flex justify-between items-center py-2 border-b last:border-0">
        <span class="text-muted-foreground">{item.label}</span>
        <span class="font-semibold tabular-nums {item.colorClass ?? ''}">
          {item.value}
        </span>
      </div>
    {/each}
  </div>
</section>
