<svelte:options runes={true} />

<script lang="ts">
import { Button } from "@/components/ui/button";
import * as Dialog from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { t } from "$lib/i18n";
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
      <Dialog.Title>{$t.tasks.createTask}</Dialog.Title>
      <Dialog.Description>
        {$t.tasks.createTaskDescription}
      </Dialog.Description>
    </Dialog.Header>

    <form onsubmit={(e) => { e.preventDefault(); void handleSubmit(); }} class="space-y-4">
      <div class="space-y-2">
        <Label for="title">{$t.tasks.taskTitle}</Label>
        <Input
          id="title"
          type="text"
          bind:value={title}
          placeholder={$t.tasks.titlePlaceholder}
          required
          maxlength={200}
        />
      </div>

      <div class="space-y-2">
        <Label for="description">{$t.tasks.descriptionOptional}</Label>
        <Textarea
          id="description"
          bind:value={description}
          placeholder={$t.tasks.descriptionPlaceholder}
          rows={3}
          maxlength={1000}
        />
      </div>

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => handleOpenChange(false)}>
          {$t.common.cancel}
        </Button>
        <Button
          type="submit"
          disabled={!title.trim() || isCreating}
          class="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500/40"
        >
          {isCreating ? $t.tasks.creating : $t.tasks.createTask}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
