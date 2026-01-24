<script lang="ts">
import { locale, t } from "$lib/i18n";
import type { AttendanceRecord } from "../types";
import {
  formatDateWithWeekday,
  formatMinutesToDuration,
  formatTimeShort,
} from "../utils";

interface Props {
  records: AttendanceRecord[];
  onSelectDate: (date: string) => void;
}

let { records, onSelectDate }: Props = $props();
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
          tabindex="0"
          class="hover:bg-muted/30 cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          onclick={() => onSelectDate(record.date)}
          onkeydown={(e) => e.key === "Enter" && onSelectDate(record.date)}
        >
          <td class="p-3 font-medium">
            {formatDateWithWeekday(record.date, $locale)}
          </td>
          <td class="p-3 text-center font-mono tabular-nums">
            {formatTimeShort(record.clockInAt)}
          </td>
          <td class="p-3 text-center font-mono tabular-nums">
            {record.clockOutAt ? formatTimeShort(record.clockOutAt) : "--:--"}
          </td>
          <td class="p-3 text-center hidden sm:table-cell">
            {formatMinutesToDuration(record.breakMinutes, $locale)}
          </td>
          <td class="p-3 text-center font-semibold">
            {formatMinutesToDuration(record.workMinutes, $locale)}
          </td>
          <td class="p-3 text-center hidden lg:table-cell text-orange-600">
            {record.overtimeMinutes > 0
              ? formatMinutesToDuration(record.overtimeMinutes, $locale)
              : "-"}
          </td>
          <td class="p-3 text-center hidden xl:table-cell text-purple-600">
            {record.lateNightMinutes > 0
              ? formatMinutesToDuration(record.lateNightMinutes, $locale)
              : "-"}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
