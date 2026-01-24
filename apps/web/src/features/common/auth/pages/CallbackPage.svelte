<script lang="ts">
import { AlertCircle, CheckCircle2, Loader2 } from "@lucide/svelte";
import { onMount } from "svelte";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { t } from "$lib/i18n";
import { goto } from "$lib/utils/navigation";
import { handleCallback } from "../stores";

type CallbackStatus = "processing" | "success" | "error";

let status = $state<CallbackStatus>("processing");
let errorMessage = $state<string | null>(null);

onMount(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const state = urlParams.get("state");
  const error = urlParams.get("error");
  const errorDescription = urlParams.get("error_description");

  // Handle OAuth error response
  if (error) {
    status = "error";
    errorMessage = errorDescription || error;
    return;
  }

  // Validate required parameters
  if (!code || !state) {
    status = "error";
    errorMessage = $t.auth.errors.missingParams;
    return;
  }

  try {
    const result = await handleCallback(code, state);

    if (result.success) {
      status = "success";
      // Redirect to the stored returnTo URL or home
      const returnTo = sessionStorage.getItem("auth_return_to") || "/";
      sessionStorage.removeItem("auth_return_to");

      // Brief delay to show success state
      setTimeout(() => {
        goto(returnTo);
      }, 500);
    } else {
      status = "error";
      errorMessage = result.error || $t.auth.errors.unknown;
    }
  } catch (err) {
    status = "error";
    errorMessage = err instanceof Error ? err.message : $t.auth.errors.unknown;
  }
});

function handleRetry() {
  goto("/login");
}

function handleGoHome() {
  goto("/");
}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
  <Card.Root class="w-full max-w-md">
    <Card.Content class="pt-6">
      {#if status === "processing"}
        <div class="flex flex-col items-center gap-4 py-8">
          <Loader2 class="h-12 w-12 animate-spin text-primary" />
          <div class="text-center space-y-2">
            <h2 class="text-xl font-semibold">{$t.auth.callback.processing}</h2>
            <p class="text-sm text-muted-foreground">{$t.auth.callback.pleaseWait}</p>
          </div>
        </div>
      {:else if status === "success"}
        <div class="flex flex-col items-center gap-4 py-8">
          <div class="rounded-full bg-green-100 dark:bg-green-900 p-3">
            <CheckCircle2 class="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <div class="text-center space-y-2">
            <h2 class="text-xl font-semibold">{$t.auth.callback.success}</h2>
            <p class="text-sm text-muted-foreground">{$t.auth.callback.redirecting}</p>
          </div>
        </div>
      {:else if status === "error"}
        <div class="flex flex-col items-center gap-4 py-8">
          <div class="rounded-full bg-red-100 dark:bg-red-900 p-3">
            <AlertCircle class="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <div class="text-center space-y-2">
            <h2 class="text-xl font-semibold">{$t.auth.callback.error}</h2>
            <p class="text-sm text-muted-foreground max-w-xs">
              {errorMessage}
            </p>
          </div>
          <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4">
            <Button
              variant="outline"
              onclick={handleGoHome}
              class="min-h-[44px] min-w-full sm:min-w-[120px]"
            >
              {$t.common.back}
            </Button>
            <Button
              onclick={handleRetry}
              class="min-h-[44px] min-w-full sm:min-w-[120px]"
            >
              {$t.auth.callback.retry}
            </Button>
          </div>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
