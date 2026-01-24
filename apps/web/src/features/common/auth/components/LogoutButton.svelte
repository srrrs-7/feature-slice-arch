<script lang="ts">
import { LogOut } from "@lucide/svelte";
import { Button } from "$lib/components/ui/button";
import { t } from "$lib/i18n";
import { logout } from "../stores";

let {
  class: className = "",
  variant = "ghost",
  size = "default",
  showIcon = true,
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
  showIcon?: boolean;
}>();

function handleLogout() {
  logout(true);
}
</script>

<Button
  {variant}
  {size}
  class={className}
  onclick={handleLogout}
>
  {#if showIcon}
    <LogOut class="mr-2 h-4 w-4" />
  {/if}
  {$t.auth.logout}
</Button>
