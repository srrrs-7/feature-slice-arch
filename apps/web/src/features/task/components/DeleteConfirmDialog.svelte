<svelte:options runes={true} />

<script lang="ts">
import { Button } from "@/components/ui/button";
import * as Dialog from "@/components/ui/dialog";
import type { Task } from "../types";

interface Props {
  open?: boolean;
  task?: Task;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting?: boolean;
}

let {
  open = false,
  task,
  onConfirm,
  onCancel,
  isDeleting = false,
}: Props = $props();

async function handleConfirm() {
  try {
    await onConfirm();
  } catch (err) {
    console.error("Failed to delete task:", err);
  }
}
</script>

<Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Delete Task</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete this task? This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>

    {#if task}
      <div class="py-4">
        <p class="text-sm font-medium">Task to be deleted:</p>
        <p class="text-sm text-muted-foreground mt-1">
          "{task.title}"
        </p>
      </div>
    {/if}

    <Dialog.Footer>
      <Button variant="outline" onclick={onCancel}>Cancel</Button>
      <Button variant="destructive" onclick={handleConfirm} disabled={isDeleting}>
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
