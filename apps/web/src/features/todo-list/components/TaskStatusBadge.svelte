<script lang="ts">
import { Badge } from "$lib/components/ui/badge";
import type { TaskStatus } from "../types";

export let status: TaskStatus;
export let clickable = false;
export let onClick: (() => void) | undefined = undefined;

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "secondary" as const,
    class: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  },
  in_progress: {
    label: "In Progress",
    variant: "default" as const,
    class: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  },
  completed: {
    label: "Completed",
    variant: "outline" as const,
    class: "bg-green-100 text-green-800 hover:bg-green-200",
  },
};

$: config = statusConfig[status];
</script>

<Badge
  variant={config.variant}
  class="{config.class} {clickable ? 'cursor-pointer' : ''}"
  onclick={() => onClick?.()}
>
  {config.label}
</Badge>
