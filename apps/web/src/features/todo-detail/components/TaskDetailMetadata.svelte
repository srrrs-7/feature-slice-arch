<script lang="ts">
import * as Card from "$lib/components/ui/card";
import { formatDateLocale } from "$lib/utils/date";
import { currentTask } from "../stores";
</script>

{#if $currentTask}
  <Card.Root class="mb-6">
    <Card.Header>
      <Card.Title>Metadata</Card.Title>
    </Card.Header>
    <Card.Content>
      <dl class="space-y-2 text-sm">
        <div class="flex justify-between">
          <dt class="font-medium text-muted-foreground">Created:</dt>
          <dd class="text-foreground">{formatDateLocale($currentTask.createdAt)}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="font-medium text-muted-foreground">Updated:</dt>
          <dd class="text-foreground">{formatDateLocale($currentTask.updatedAt)}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="font-medium text-muted-foreground">ID:</dt>
          <dd class="text-foreground font-mono text-xs break-all">
            {$currentTask.id}
          </dd>
        </div>
      </dl>
    </Card.Content>
  </Card.Root>
{/if}
