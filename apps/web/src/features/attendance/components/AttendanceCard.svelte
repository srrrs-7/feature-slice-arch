<script lang="ts">
import { Badge } from "@/components/ui/badge";
import { locale, t } from "$lib/i18n";
import type { AttendanceRecord } from "../types";
import {
  formatDateWithWeekday,
  formatMinutesToDuration,
  formatTimeShort,
  getWorkStatusVariant,
} from "../utils";

interface Props {
  record: AttendanceRecord;
  onclick: () => void;
}

let { record, onclick }: Props = $props();

const variant = $derived(getWorkStatusVariant(record.workMinutes));
</script>

<button
  type="button"
  class="w-full text-left p-4 bg-card rounded-lg shadow-sm border hover:shadow-md transition-shadow active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
  {onclick}
>
  <div class="flex justify-between items-start mb-3">
    <div>
      <p class="font-semibold text-foreground">
        {formatDateWithWeekday(record.date, $locale)}
      </p>
      <p class="text-sm text-muted-foreground">
        {formatTimeShort(record.clockInAt)} - {record.clockOutAt
          ? formatTimeShort(record.clockOutAt)
          : "--:--"}
      </p>
    </div>
    <Badge {variant}>
      {formatMinutesToDuration(record.workMinutes, $locale)}
    </Badge>
  </div>
  <div class="grid grid-cols-2 gap-2 text-sm">
    <div>
      <span class="text-muted-foreground">{$t.attendance.breakTime}:</span>
      <span class="ml-1 font-medium"
        >{formatMinutesToDuration(record.breakMinutes, $locale)}</span
      >
    </div>
    <div>
      <span class="text-muted-foreground">{$t.attendance.overtimeMinutes}:</span
      >
      <span class="ml-1 font-medium"
        >{formatMinutesToDuration(record.overtimeMinutes, $locale)}</span
      >
    </div>
  </div>
</button>
