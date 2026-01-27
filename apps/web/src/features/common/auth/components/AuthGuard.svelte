<script lang="ts">
import { LogIn, ShieldAlert } from "@lucide/svelte";
import type { Snippet } from "svelte";
import { Button } from "@/components/ui/button";
import { t } from "$lib/i18n";
import { authState, isAuthenticated, isAuthLoading, login } from "../stores";

let {
  children,
  fallback,
  requiredRoles = [],
  redirectToLogin = false,
} = $props<{
  children: Snippet;
  fallback?: Snippet;
  requiredRoles?: string[];
  redirectToLogin?: boolean;
}>();

// Check role-based access
function hasRequiredRole(userGroups: string[], required: string[]): boolean {
  if (required.length === 0) return true;
  return required.some((role) => userGroups.includes(role));
}

// Redirect to login if not authenticated and redirectToLogin is true
$effect(() => {
  if (redirectToLogin && $authState.status === "unauthenticated") {
    void login();
  }
});
</script>

{#if $isAuthLoading}
  <!-- Loading state -->
  <div class="flex items-center justify-center min-h-[200px]">
    <div class="flex flex-col items-center gap-4">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p class="text-sm text-muted-foreground">{$t.common.loading}</p>
    </div>
  </div>
{:else if $isAuthenticated}
  {#if requiredRoles.length === 0 || hasRequiredRole($authState.status === "authenticated" ? $authState.user.groups : [], requiredRoles)}
    <!-- Authorized -->
    {@render children()}
  {:else}
    <!-- Forbidden (authenticated but missing role) -->
    {#if fallback}
      {@render fallback()}
    {:else}
      <div class="flex items-center justify-center min-h-[200px]">
        <div class="flex flex-col items-center gap-4 text-center p-6">
          <ShieldAlert class="h-12 w-12 text-destructive" />
          <h2 class="text-xl font-semibold">{$t.auth.accessDenied}</h2>
          <p class="text-sm text-muted-foreground max-w-md">
            {$t.auth.insufficientPermissions}
          </p>
        </div>
      </div>
    {/if}
  {/if}
{:else}
  <!-- Unauthenticated -->
  {#if fallback}
    {@render fallback()}
  {:else if !redirectToLogin}
    <div class="flex items-center justify-center min-h-[200px]">
      <div class="flex flex-col items-center gap-4 text-center p-6">
        <LogIn class="h-12 w-12 text-muted-foreground" />
        <h2 class="text-xl font-semibold">{$t.auth.loginRequired}</h2>
        <p class="text-sm text-muted-foreground max-w-md">
          {$t.auth.pleaseLogin}
        </p>
        <Button onclick={() => login()}>
          <LogIn class="mr-2 h-4 w-4" />
          {$t.auth.login}
        </Button>
      </div>
    </div>
  {/if}
{/if}
