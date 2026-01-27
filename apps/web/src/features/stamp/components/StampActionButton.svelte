<script lang="ts">
import { Button } from "@/components/ui/button";
import { t } from "$lib/i18n";
import type { WorkStatus } from "../types";

export let status: WorkStatus;
export let isLoading: boolean;
export let onClockIn: () => void;
export let onClockOut: () => void;
export let onBreakStart: () => void;
export let onBreakEnd: () => void;

type ActionConfig = {
  labelKey: "clockIn" | "clockOut" | "breakStart" | "breakEnd";
  variant: "default" | "secondary" | "destructive" | "outline";
  action: () => void;
};

$: actions = getActionsForStatus(status);

function getActionsForStatus(status: WorkStatus): ActionConfig[] {
  switch (status) {
    case "not_working":
      return [{ labelKey: "clockIn", variant: "default", action: onClockIn }];
    case "working":
      return [
        { labelKey: "breakStart", variant: "secondary", action: onBreakStart },
        { labelKey: "clockOut", variant: "destructive", action: onClockOut },
      ];
    case "on_break":
      return [{ labelKey: "breakEnd", variant: "default", action: onBreakEnd }];
    case "clocked_out":
      return [];
  }
}

function getLabel(
  labelKey: "clockIn" | "clockOut" | "breakStart" | "breakEnd",
): string {
  return $t.stamp[labelKey];
}
</script>

<div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
  {#each actions as { labelKey, variant, action }}
    <Button
      {variant}
      size="lg"
      class="min-h-[48px] sm:min-h-[52px] min-w-full sm:min-w-[140px] text-base sm:text-lg font-semibold"
      disabled={isLoading}
      onclick={action}
    >
      {#if isLoading}
        <span class="animate-spin mr-2">⏳</span>
      {/if}
      {getLabel(labelKey)}
    </Button>
  {/each}

  {#if status === "clocked_out"}
    <p class="text-sm sm:text-base text-muted-foreground text-center py-3 sm:py-4">
      {$t.stamp.status.finished}
    </p>
  {/if}
</div>
