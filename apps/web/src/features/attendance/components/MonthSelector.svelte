<script lang="ts">
import ChevronLeft from "@lucide/svelte/icons/chevron-left";
import ChevronRight from "@lucide/svelte/icons/chevron-right";
import { Button } from "$lib/components/ui/button";
import { locale, t } from "$lib/i18n";
import { formatMonthLabel } from "../utils";

interface Props {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onThisMonth: () => void;
}

let { year, month, onPrevMonth, onNextMonth, onThisMonth }: Props = $props();

const monthLabel = $derived(formatMonthLabel(year, month, $locale));
</script>

<div class="flex items-center gap-2 sm:gap-4">
  <Button
    variant="ghost"
    size="icon"
    onclick={onPrevMonth}
    aria-label={$locale === "ja" ? "前の月" : "Previous month"}
    class="min-h-[44px] min-w-[44px]"
  >
    <ChevronLeft class="h-5 w-5" />
  </Button>

  <span
    class="text-lg sm:text-xl font-semibold min-w-[140px] sm:min-w-[160px] text-center"
  >
    {monthLabel}
  </span>

  <Button
    variant="ghost"
    size="icon"
    onclick={onNextMonth}
    aria-label={$locale === "ja" ? "次の月" : "Next month"}
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
