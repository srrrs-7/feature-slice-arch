<script lang="ts">
import { locale, t } from "$lib/i18n";
import type { AttendanceSummary } from "../types";
import { formatMinutesToDuration } from "../utils";

interface Props {
  summary: AttendanceSummary;
}

let { summary }: Props = $props();
</script>

<section
  class="p-4 sm:p-6 bg-card rounded-xl border shadow-sm"
  aria-labelledby="summary-title"
>
  <h3 id="summary-title" class="text-lg font-semibold mb-4">
    {$t.attendance.summary}
  </h3>

  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
    <!-- Work Days -->
    <div class="text-center p-3 bg-muted/50 rounded-lg">
      <p class="text-xs sm:text-sm text-muted-foreground">
        {$t.attendance.workDays}
      </p>
      <p class="text-xl sm:text-2xl font-bold tabular-nums mt-1">
        {summary.workDays}<span class="text-xs sm:text-sm font-normal ml-1"
          >{$t.attendance.days}</span
        >
      </p>
    </div>

    <!-- Total Work Time -->
    <div class="text-center p-3 bg-muted/50 rounded-lg">
      <p class="text-xs sm:text-sm text-muted-foreground">
        {$t.attendance.totalWorkTime}
      </p>
      <p class="text-xl sm:text-2xl font-bold tabular-nums mt-1">
        {formatMinutesToDuration(summary.totalWorkMinutes, $locale)}
      </p>
    </div>

    <!-- Total Overtime -->
    <div class="text-center p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
      <p class="text-xs sm:text-sm text-orange-700 dark:text-orange-300">
        {$t.attendance.totalOvertime}
      </p>
      <p
        class="text-xl sm:text-2xl font-bold tabular-nums mt-1 text-orange-700 dark:text-orange-300"
      >
        {formatMinutesToDuration(summary.totalOvertimeMinutes, $locale)}
      </p>
    </div>

    <!-- Total Late Night -->
    <div class="text-center p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
      <p class="text-xs sm:text-sm text-purple-700 dark:text-purple-300">
        {$t.attendance.totalLateNight}
      </p>
      <p
        class="text-xl sm:text-2xl font-bold tabular-nums mt-1 text-purple-700 dark:text-purple-300"
      >
        {formatMinutesToDuration(summary.totalLateNightMinutes, $locale)}
      </p>
    </div>

    <!-- Total Statutory Overtime -->
    <div class="text-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
      <p class="text-xs sm:text-sm text-red-700 dark:text-red-300">
        {$t.attendance.totalStatutoryOvertime}
      </p>
      <p
        class="text-xl sm:text-2xl font-bold tabular-nums mt-1 text-red-700 dark:text-red-300"
      >
        {formatMinutesToDuration(summary.totalStatutoryOvertimeMinutes, $locale)}
      </p>
    </div>
  </div>
</section>
