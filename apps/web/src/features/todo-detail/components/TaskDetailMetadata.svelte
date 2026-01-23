<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { currentTask } from "../stores";

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
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
          <dd class="text-foreground">{formatDate($currentTask.createdAt)}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="font-medium text-muted-foreground">Updated:</dt>
          <dd class="text-foreground">{formatDate($currentTask.updatedAt)}</dd>
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
