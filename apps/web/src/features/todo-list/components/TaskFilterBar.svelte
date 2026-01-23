<script lang="ts">
import { Badge } from "$lib/components/ui/badge";
import * as Tabs from "$lib/components/ui/tabs";
import { currentFilter, setFilter, taskStats } from "../stores";
import type { TaskFilter } from "../types";

function handleValueChange(value: string | undefined) {
  if (value) {
    setFilter(value as TaskFilter);
  }
}
</script>

<Tabs.Root value={$currentFilter} onValueChange={handleValueChange} class="mb-6">
  <Tabs.List class="grid w-full grid-cols-4">
    <Tabs.Trigger value="all" class="gap-2">
      All
      <Badge variant="secondary">{$taskStats.total}</Badge>
    </Tabs.Trigger>
    <Tabs.Trigger value="pending" class="gap-2">
      Pending
      <Badge variant="secondary">{$taskStats.pending}</Badge>
    </Tabs.Trigger>
    <Tabs.Trigger value="in_progress" class="gap-2">
      In Progress
      <Badge variant="secondary">{$taskStats.inProgress}</Badge>
    </Tabs.Trigger>
    <Tabs.Trigger value="completed" class="gap-2">
      Completed
      <Badge variant="secondary">{$taskStats.completed}</Badge>
    </Tabs.Trigger>
  </Tabs.List>
</Tabs.Root>
