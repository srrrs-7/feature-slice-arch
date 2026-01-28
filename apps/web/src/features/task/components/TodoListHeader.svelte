<script lang="ts">
import { Button } from "@/components/ui/button";
import { t } from "$lib/i18n";
import { dialogActions } from "../stores";
</script>

<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
  <div>
    <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
      {$t.tasks.title}
    </h1>
    <p class="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
      {$t.tasks.subtitle}
    </p>
  </div>
  <Button
    onclick={dialogActions.openCreate}
    class="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500/40"
  >
    + {$t.tasks.createTask}
  </Button>
</div>
