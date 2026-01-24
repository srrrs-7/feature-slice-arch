<script lang="ts">
import { Loader2, LogIn } from "@lucide/svelte";
import { Button } from "$lib/components/ui/button";
import * as Card from "$lib/components/ui/card";
import { t } from "$lib/i18n";
import { goto } from "$lib/utils/navigation";
import { isAuthenticated, isAuthLoading, login } from "../stores";

let { returnTo = "/" } = $props<{ returnTo?: string }>();

// Redirect if already authenticated
$effect(() => {
  if ($isAuthenticated) {
    goto(returnTo);
  }
});

let isLoggingIn = $state(false);

async function handleLogin() {
  isLoggingIn = true;
  try {
    await login(returnTo);
  } catch (error) {
    console.error("Login failed:", error);
    isLoggingIn = false;
  }
}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
  <Card.Root class="w-full max-w-md">
    <Card.Header class="text-center space-y-2">
      <!-- App Logo/Brand -->
      <div class="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4">
        <span class="text-3xl font-bold text-primary-foreground">W</span>
      </div>
      <Card.Title class="text-2xl sm:text-3xl font-bold">
        {$t.common.appName}
      </Card.Title>
      <Card.Description class="text-sm sm:text-base">
        {$t.auth.loginDescription}
      </Card.Description>
    </Card.Header>

    <Card.Content class="space-y-6">
      {#if $isAuthLoading}
        <div class="flex flex-col items-center gap-4 py-8">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
          <p class="text-sm text-muted-foreground">{$t.common.loading}</p>
        </div>
      {:else}
        <Button
          onclick={handleLogin}
          disabled={isLoggingIn}
          class="w-full min-h-[48px] text-base font-semibold"
          size="lg"
        >
          {#if isLoggingIn}
            <Loader2 class="mr-2 h-5 w-5 animate-spin" />
            {$t.auth.loggingIn}
          {:else}
            <LogIn class="mr-2 h-5 w-5" />
            {$t.auth.loginWithCognito}
          {/if}
        </Button>

        <div class="text-center">
          <p class="text-xs text-muted-foreground">
            {$t.auth.secureLogin}
          </p>
        </div>
      {/if}
    </Card.Content>

    <Card.Footer class="flex justify-center border-t pt-6">
      <p class="text-xs text-muted-foreground">
        {$t.auth.termsNotice}
      </p>
    </Card.Footer>
  </Card.Root>
</div>
