<script lang="ts">
import { Button } from "$lib/components/ui/button";
import { dialogActions } from "../stores";
</script>

<div class="flex items-center justify-between mb-8">
  <div>
    <h1 class="text-4xl font-bold text-foreground">Todo List</h1>
    <p class="text-muted-foreground mt-2">Manage your tasks efficiently</p>
  </div>
  <Button onclick={dialogActions.openCreate}>
    + New Task
  </Button>
</div>
