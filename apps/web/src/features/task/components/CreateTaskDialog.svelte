<svelte:options runes={true} />

<script lang="ts">
import { Button } from "@/components/ui/button";
import * as Dialog from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateTaskInput } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: CreateTaskInput) => Promise<void>;
  isCreating?: boolean;
}

let { open, onOpenChange, onCreate, isCreating = false }: Props = $props();

let title = $state("");
let description = $state("");

async function handleSubmit() {
  if (!title.trim()) return;

  try {
    await onCreate({
      title: title.trim(),
      description: description.trim() || null,
    });
    title = "";
    description = "";
  } catch (err) {
    console.error("Failed to create task:", err);
  }
}

function handleOpenChange(isOpen: boolean) {
  if (!isOpen) {
    title = "";
    description = "";
  }
  onOpenChange(isOpen);
}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Create New Task</Dialog.Title>
      <Dialog.Description>
        Add a new task to your todo list. Fill in the details below.
      </Dialog.Description>
    </Dialog.Header>

    <form onsubmit={(e) => { e.preventDefault(); void handleSubmit(); }} class="space-y-4">
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
        <Button type="button" variant="outline" onclick={() => handleOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={!title.trim() || isCreating}>
          {isCreating ? "Creating..." : "Create Task"}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
