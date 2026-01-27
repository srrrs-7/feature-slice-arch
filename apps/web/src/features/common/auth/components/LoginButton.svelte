<script lang="ts">
import { Button } from "@/components/ui/button";
import { t } from "$lib/i18n";
import { isAuthLoading, login } from "../stores";

let {
  class: className = "",
  variant = "default",
  size = "default",
} = $props<{
  class?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}>();

async function handleLogin() {
  await login();
}
</script>

<Button
  {variant}
  {size}
  class={className}
  onclick={handleLogin}
  disabled={$isAuthLoading}
>
  {#if $isAuthLoading}
    <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
  {/if}
  {$t.auth.login}
</Button>
