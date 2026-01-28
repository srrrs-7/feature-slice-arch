<script lang="ts">
import { quintOut } from "svelte/easing";
import { fade, fly } from "svelte/transition";
import AppLogo from "@/components/AppLogo.svelte";
import { t } from "$lib/i18n";
import type { AppSidebarProps } from "../types";
import { navigationItems } from "./navigation-items";

// Props (Svelte 5 runes)
let {
  currentPath = "/",
  open = false,
  collapsed = false,
  onClose,
  onToggleCollapse,
}: AppSidebarProps = $props();

/**
 * Handle navigation item click - closes mobile drawer
 */
function handleNavClick() {
  onClose?.();
}

/**
 * Handle keyboard events - Escape closes drawer
 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && open) {
    onClose?.();
  }
}

/**
 * Check if route is active (supports nested routes)
 */
function isActive(href: string): boolean {
  if (href === "/") {
    return currentPath === "/";
  }
  return currentPath?.startsWith(href) ?? false;
}

/**
 * Get translated label for navigation item
 */
function getNavLabel(
  labelKey: "home" | "tasks" | "stamp" | "attendance" | "files" | "settings",
): string {
  return $t.nav[labelKey];
}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Desktop Sidebar: Collapsible Drawer -->
<aside
  class="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 bg-background border-r border-border transition-all duration-300
         {collapsed ? 'lg:w-16' : 'lg:w-64'}"
>
  <!-- Header -->
  <div
    class="flex items-center h-16 border-b border-border {collapsed
      ? 'justify-center px-2'
      : 'justify-between px-4'}"
  >
    {#if !collapsed}
      <a
        href="/"
        class="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors"
      >
        <AppLogo size="md" />
        <span>{$t.common.appName}</span>
      </a>
    {/if}
    <!-- Collapse Toggle Button -->
    <button
      onclick={onToggleCollapse}
      aria-label={collapsed ? $t.nav.expandSidebar : $t.nav.collapseSidebar}
      class="min-h-[40px] min-w-[40px] p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {#if collapsed}
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 5l7 7-7 7M5 5l7 7-7 7"
          />
        {:else}
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 19l-7-7 7-7M19 19l-7-7 7-7"
          />
        {/if}
      </svg>
    </button>
  </div>

  <!-- Navigation -->
  <nav
    class="flex-1 overflow-y-auto {collapsed ? 'p-2' : 'p-4'}"
    aria-label={$t.nav.home}
  >
    <div class="space-y-1">
      {#each navigationItems as item (item.href)}
        <a
          href={item.href}
          title={collapsed ? getNavLabel(item.labelKey) : undefined}
          class="flex items-center rounded-md text-sm font-medium min-h-[44px] transition-colors
                 {collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'}
                 {isActive(item.href)
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}"
        >
          {#if item.href === "/"}
            <AppLogo size="sm" />
          {:else}
            <svg
              class="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox={item.iconViewBox || "0 0 20 20"}
            >
              <path
                fill-rule={item.iconFillRule || "evenodd"}
                d={item.iconPath}
                clip-rule="evenodd"
              />
            </svg>
          {/if}
          {#if !collapsed}
            <span>{getNavLabel(item.labelKey)}</span>
          {/if}
        </a>
      {/each}
    </div>
  </nav>
</aside>

<!-- Mobile Sidebar: Modal Drawer -->
{#if open}
  <div class="fixed inset-0 z-50 lg:hidden" transition:fade={{ duration: 200 }}>
    <!-- Backdrop -->
    <button
      type="button"
      class="absolute inset-0 bg-black/50 cursor-default"
      onclick={onClose}
      aria-label={$t.nav.closeMenu}
      tabindex="-1"
    ></button>

    <!-- Drawer -->
    <div
      class="absolute inset-y-0 left-0 w-4/5 max-w-sm bg-background shadow-2xl flex flex-col"
      transition:fly={{ x: -300, duration: 300, easing: quintOut }}
      role="dialog"
      aria-modal="true"
      aria-label={$t.nav.home}
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Header with close button -->
      <div
        class="flex items-center justify-between h-16 px-6 border-b border-border"
      >
        <a
          href="/"
          class="flex items-center gap-2 text-lg font-semibold text-foreground"
        >
          <AppLogo size="md" />
          <span>{$t.common.appName}</span>
        </a>
        <button
          class="min-h-[44px] min-w-[44px] p-2 rounded-md hover:bg-accent transition-colors"
          onclick={onClose}
          aria-label={$t.nav.closeMenu}
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-4" aria-label={$t.nav.home}>
        <div class="space-y-1">
          {#each navigationItems as item (item.href)}
            <a
              href={item.href}
              onclick={handleNavClick}
              class="flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium min-h-[44px]
                     {isActive(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-foreground hover:bg-accent'}
                     transition-colors"
            >
              <svg
                class="w-5 h-5 flex-shrink-0"
                fill="currentColor"
                viewBox={item.iconViewBox || "0 0 20 20"}
              >
                <path
                  fill-rule={item.iconFillRule || "evenodd"}
                  d={item.iconPath}
                  clip-rule="evenodd"
                />
              </svg>
              <span>{getNavLabel(item.labelKey)}</span>
            </a>
          {/each}
        </div>
      </nav>
    </div>
  </div>
{/if}
