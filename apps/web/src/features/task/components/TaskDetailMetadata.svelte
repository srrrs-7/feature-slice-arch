<svelte:options runes={true} />

<script lang="ts">
import * as Card from "@/components/ui/card";
import { formatDateLocale } from "$lib/utils/date";
import type { Task } from "../types";

interface Props {
  task: Task;
}

let { task }: Props = $props();
</script>

<Card.Root class="mb-6">
  <Card.Header>
    <Card.Title>Metadata</Card.Title>
  </Card.Header>
  <Card.Content>
    <dl class="space-y-2 text-sm">
      <div class="flex justify-between">
        <dt class="font-medium text-muted-foreground">Created:</dt>
        <dd class="text-foreground">{formatDateLocale(task.createdAt)}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="font-medium text-muted-foreground">Updated:</dt>
        <dd class="text-foreground">{formatDateLocale(task.updatedAt)}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="font-medium text-muted-foreground">ID:</dt>
        <dd class="text-foreground font-mono text-xs break-all">
          {task.id}
        </dd>
      </div>
    </dl>
  </Card.Content>
</Card.Root>
