<script lang="ts">
import { Button } from "$lib/components/ui/button";
import type { WorkStatus } from "../types";

export let status: WorkStatus;
export let isLoading: boolean;
export let onClockIn: () => void;
export let onClockOut: () => void;
export let onBreakStart: () => void;
export let onBreakEnd: () => void;

type ActionConfig = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  action: () => void;
};

$: actions = getActionsForStatus(status);

function getActionsForStatus(status: WorkStatus): ActionConfig[] {
  switch (status) {
    case "not_working":
      return [{ label: "出勤", variant: "default", action: onClockIn }];
    case "working":
      return [
        { label: "休憩開始", variant: "secondary", action: onBreakStart },
        { label: "退勤", variant: "destructive", action: onClockOut },
      ];
    case "on_break":
      return [{ label: "休憩終了", variant: "default", action: onBreakEnd }];
    case "clocked_out":
      return [];
  }
}
</script>

<div class="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
  {#each actions as { label, variant, action }}
    <Button
      {variant}
      size="lg"
      class="min-h-[52px] min-w-[140px] text-lg font-semibold"
      disabled={isLoading}
      onclick={action}
    >
      {#if isLoading}
        <span class="animate-spin mr-2">⏳</span>
      {/if}
      {label}
    </Button>
  {/each}

  {#if status === "clocked_out"}
    <p class="text-muted-foreground text-center py-4">
      本日の勤務は終了しました。お疲れさまでした。
    </p>
  {/if}
</div>
