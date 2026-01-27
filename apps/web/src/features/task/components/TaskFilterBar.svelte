<script lang="ts">
import { Badge } from "@/components/ui/badge";
import * as Tabs from "@/components/ui/tabs";
import { t } from "$lib/i18n";
import { currentFilter, setFilter, taskStats } from "../stores";
import type { TaskFilter } from "../types";

function handleValueChange(value: string | undefined) {
  if (value) {
    setFilter(value as TaskFilter);
  }
}
</script>

<Tabs.Root value={$currentFilter} onValueChange={handleValueChange} class="mb-4 sm:mb-6">
  <Tabs.List class="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
    <Tabs.Trigger value="all" class="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
      <span>{$t.tasks.all}</span>
      <Badge variant="secondary" class="text-xs">{$taskStats.total}</Badge>
    </Tabs.Trigger>
    <Tabs.Trigger value="pending" class="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
      <span class="hidden sm:inline">{$t.tasks.pending}</span>
      <span class="sm:hidden">{$t.tasks.pending.slice(0, 4)}</span>
      <Badge variant="secondary" class="text-xs">{$taskStats.pending}</Badge>
    </Tabs.Trigger>
    <Tabs.Trigger value="in_progress" class="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
      <span class="hidden sm:inline">{$t.tasks.inProgress}</span>
      <span class="sm:hidden">{$t.tasks.inProgress.slice(0, 4)}</span>
      <Badge variant="secondary" class="text-xs">{$taskStats.inProgress}</Badge>
    </Tabs.Trigger>
    <Tabs.Trigger value="completed" class="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
      <span class="hidden sm:inline">{$t.tasks.completed}</span>
      <span class="sm:hidden">{$t.tasks.completed.slice(0, 4)}</span>
      <Badge variant="secondary" class="text-xs">{$taskStats.completed}</Badge>
    </Tabs.Trigger>
  </Tabs.List>
</Tabs.Root>
