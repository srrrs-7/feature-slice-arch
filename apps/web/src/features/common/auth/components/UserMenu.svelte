<script lang="ts">
import { ChevronDown, LogOut } from "@lucide/svelte";
import { Button } from "@/components/ui/button";
import { t } from "$lib/i18n";
import { currentUser, logout } from "../stores";

let { class: className = "" } = $props<{ class?: string }>();

let isOpen = $state(false);

function handleLogout() {
  isOpen = false;
  logout(true);
}

function toggleMenu() {
  isOpen = !isOpen;
}

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest("[data-user-menu]")) {
    isOpen = false;
  }
}

// Handle escape key
function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    isOpen = false;
  }
}

$effect(() => {
  if (isOpen) {
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeydown);
    };
  }
});

// Get user initials for avatar
function getInitials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

const displayName = $derived(
  $currentUser?.name ?? $currentUser?.email ?? "User",
);
</script>

{#if $currentUser}
  <div class="relative {className}" data-user-menu>
    <Button
      variant="ghost"
      onclick={toggleMenu}
      class="flex items-center gap-2 px-2 py-1 h-auto min-h-[44px]"
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      <!-- Avatar -->
      {#if $currentUser.picture}
        <img
          src={$currentUser.picture}
          alt={displayName}
          class="h-8 w-8 rounded-full object-cover"
        />
      {:else}
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
          {getInitials($currentUser.name, $currentUser.email)}
        </div>
      {/if}

      <!-- Name (hidden on mobile) -->
      <span class="hidden sm:inline-block max-w-[120px] truncate text-sm">
        {displayName}
      </span>

      <ChevronDown class="h-4 w-4 opacity-50 transition-transform {isOpen ? 'rotate-180' : ''}" />
    </Button>

    <!-- Dropdown Menu -->
    {#if isOpen}
      <div
        class="absolute right-0 mt-2 w-56 origin-top-right bg-popover border border-border rounded-md shadow-lg z-50 animate-in fade-in-0 zoom-in-95"
        role="menu"
        aria-orientation="vertical"
      >
        <!-- User Info -->
        <div class="px-4 py-3 border-b border-border">
          <p class="text-sm font-medium leading-none truncate">
            {$currentUser.name ?? "User"}
          </p>
          {#if $currentUser.email}
            <p class="text-xs leading-none text-muted-foreground truncate mt-1">
              {$currentUser.email}
            </p>
          {/if}
        </div>

        <!-- Menu Items -->
        <div class="py-1">
          <button
            onclick={handleLogout}
            class="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors cursor-pointer"
            role="menuitem"
          >
            <LogOut class="h-4 w-4" />
            {$t.auth.logout}
          </button>
        </div>
      </div>
    {/if}
  </div>
{/if}
