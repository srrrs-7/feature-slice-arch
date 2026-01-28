<script lang="ts">
import AppLogo from "@/components/AppLogo.svelte";
import LanguageSwitcher from "@/components/LanguageSwitcher.svelte";
import { LoginButton, UserMenu } from "@/features/common/auth";
import {
  isAuthenticated,
  isCognitoConfigured,
} from "@/features/common/auth/stores";
import { t } from "$lib/i18n";
import type { AppHeaderProps } from "../types";

// Props (Svelte 5 runes)
let { currentPath = "/" }: AppHeaderProps = $props();

// Check if Cognito is configured
const showAuthControls = $derived(isCognitoConfigured());

// Navigation items
const navItems = [
  { href: "/", labelKey: "home" },
  { href: "/tasks", labelKey: "tasks" },
] as const;

/**
 * Check if route is active
 */
function isActive(href: string): boolean {
  if (href === "/") {
    return currentPath === "/";
  }
  return currentPath?.startsWith(href) ?? false;
}
</script>

<header class="sticky top-0 z-40 w-full bg-background shadow-md">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a
        href="/"
        class="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors"
      >
        <AppLogo size="lg" />
        <span class="hidden sm:inline">{$t.common.appName}</span>
      </a>

      <!-- Desktop Navigation -->
      <nav
        class="hidden md:flex items-center gap-1"
        aria-label={$t.nav.home}
      >
        {#each navItems as item (item.href)}
          <a
            href={item.href}
            class="px-4 py-2 rounded-md text-sm font-medium min-h-[44px] flex items-center
                   {isActive(item.href)
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
                   transition-colors"
          >
            {$t.nav[item.labelKey]}
          </a>
        {/each}
      </nav>

      <!-- User Info & Controls -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Language Switcher -->
        <LanguageSwitcher />

        <!-- User Info -->
        {#if showAuthControls}
          {#if $isAuthenticated}
            <UserMenu />
          {:else}
            <LoginButton />
          {/if}
        {:else}
          <!-- Default User Info (when Cognito is not configured) -->
          <div class="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md hover:bg-accent transition-colors cursor-pointer">
            <div
              class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm"
            >
              U
            </div>
            <div class="hidden sm:flex flex-col">
              <span class="text-sm font-medium text-foreground">User</span>
              <span class="text-xs text-muted-foreground">user@example.com</span>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</header>
