<script lang="ts">
  import * as Dialog from "$lib/components/ui/dialog";
  import { Button } from "$lib/components/ui/button";
  import { currentTask, taskDetailStore } from "../stores";

  export let open = false;
  export let onConfirm: () => void;
  export let onCancel: () => void;

  async function handleConfirm() {
    if (!$currentTask) return;

    try {
      await taskDetailStore.deleteTask($currentTask.id);
      onConfirm();
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

    {#if $currentTask}
      <div class="py-4">
        <p class="text-sm font-medium">Task to be deleted:</p>
        <p class="text-sm text-muted-foreground mt-1">
          "{$currentTask.title}"
        </p>
      </div>
    {/if}

    <Dialog.Footer>
      <Button variant="outline" on:click={onCancel}>Cancel</Button>
      <Button variant="destructive" on:click={handleConfirm}>
        Delete
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
