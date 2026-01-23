<script lang="ts">
import { Button } from "$lib/components/ui/button";
import * as Dialog from "$lib/components/ui/dialog";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import { Textarea } from "$lib/components/ui/textarea";
import { dialogActions, dialogs, tasksStore } from "../stores";

let title = "";
let description = "";

async function handleSubmit() {
  if (!title.trim()) return;

  try {
    await tasksStore.create({
      title: title.trim(),
      description: description.trim() || null,
    });
    title = "";
    description = "";
    dialogActions.closeCreate();
  } catch (err) {
    console.error("Failed to create task:", err);
  }
}

function handleOpenChange(open: boolean) {
  if (!open) {
    dialogActions.closeCreate();
    title = "";
    description = "";
  }
}
</script>

<Dialog.Root open={$dialogs.createTask} onOpenChange={handleOpenChange}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Create New Task</Dialog.Title>
      <Dialog.Description>
        Add a new task to your todo list. Fill in the details below.
      </Dialog.Description>
    </Dialog.Header>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div class="space-y-2">
        <Label for="title">Title</Label>
        <Input
          id="title"
          type="text"
          bind:value={title}
          placeholder="Enter task title"
          required
          maxlength={200}
        />
      </div>

      <div class="space-y-2">
        <Label for="description">Description (Optional)</Label>
        <Textarea
          id="description"
          bind:value={description}
          placeholder="Enter task description"
          rows={3}
          maxlength={1000}
        />
      </div>

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => dialogActions.closeCreate()}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim()}>
          Create Task
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
