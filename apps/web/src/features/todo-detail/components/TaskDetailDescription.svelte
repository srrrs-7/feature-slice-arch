<script lang="ts">
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { Textarea } from "$lib/components/ui/textarea";
import { currentTask, taskDetailStore } from "../stores";

let isEditing = false;
let editDescription = "";

function startEdit() {
  if (!$currentTask) return;
  editDescription = $currentTask.description || "";
  isEditing = true;
}

function cancelEdit() {
  isEditing = false;
  editDescription = "";
}

async function saveDescription() {
  if (!$currentTask) return;

  const trimmed = editDescription.trim();
  const value = trimmed.length === 0 ? null : trimmed;

  try {
    await taskDetailStore.updateDescription($currentTask.id, value);
    isEditing = false;
  } catch (err) {
    console.error("Failed to update description:", err);
  }
}
</script>

{#if $currentTask}
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
          on:click={startEdit}
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === "Enter" && startEdit()}
        >
          {#if $currentTask.description}
            <p class="whitespace-pre-wrap text-foreground">
              {$currentTask.description}
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
{/if}
