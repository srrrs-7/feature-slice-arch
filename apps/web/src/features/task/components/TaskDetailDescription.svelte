<svelte:options runes={true} />

<script lang="ts">
import { Button } from "@/components/ui/button";
import * as Card from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Task } from "../types";

interface Props {
  task: Task;
  onUpdateDescription: (description: string | null) => Promise<void>;
}

let { task, onUpdateDescription }: Props = $props();

let isEditing = $state(false);
let editDescription = $state("");

function startEdit() {
  editDescription = task.description || "";
  isEditing = true;
}

function cancelEdit() {
  isEditing = false;
  editDescription = "";
}

async function saveDescription() {
  const trimmed = editDescription.trim();
  const value = trimmed.length === 0 ? null : trimmed;

  try {
    await onUpdateDescription(value);
    isEditing = false;
  } catch (err) {
    console.error("Failed to update description:", err);
  }
}
</script>

<Card.Root class="mb-6">
  <Card.Header>
    <Card.Title>Description</Card.Title>
  </Card.Header>
  <Card.Content>
    {#if isEditing}
      <div class="space-y-3">
        <Textarea
          bind:value={editDescription}
          placeholder="Enter task description"
          rows={5}
          maxlength={1000}
          class="resize-none"
        />
        <div class="flex gap-2">
          <Button size="sm" onclick={saveDescription}>Save</Button>
          <Button size="sm" variant="outline" onclick={cancelEdit}>
            Cancel
          </Button>
        </div>
      </div>
    {:else}
      <div
        class="min-h-[100px] cursor-pointer hover:bg-muted/50 rounded p-3 transition-colors"
        onclick={startEdit}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === "Enter" && startEdit()}
      >
        {#if task.description}
          <p class="whitespace-pre-wrap text-foreground">
            {task.description}
          </p>
        {:else}
          <p class="text-muted-foreground italic">
            No description provided. Click to add.
          </p>
        {/if}
      </div>
    {/if}
  </Card.Content>
</Card.Root>
