<script lang="ts">
import { quintOut } from "svelte/easing";
import { fade, fly } from "svelte/transition";
import type { AppHeaderProps } from "../types";

// Props (Svelte 5 runes)
let { currentPath = "/", onMenuClick }: AppHeaderProps = $props();

// State
let menuOpen = $state(false);

// Navigation items
const navItems = [
  { href: "/", label: "Home" },
  { href: "/tasks", label: "Tasks" },
];

/**
 * Toggle mobile menu
 */
function toggleMenu() {
  menuOpen = !menuOpen;
  onMenuClick?.();
}

/**
 * Close mobile menu
 */
function closeMenu() {
  menuOpen = false;
}

/**
 * Handle keyboard events - Escape closes menu
 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && menuOpen) {
    closeMenu();
  }
}

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

<svelte:window on:keydown={handleKeydown} />

<header class="sticky top-0 z-40 w-full bg-background shadow-md">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a
        href="/"
        class="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors"
      >
        <svg
          class="w-8 h-8 text-primary"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5a1 1 0 112 0v4a1 1 0 11-2 0V5zm1 8a1 1 0 100 2 1 1 0 000-2z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="hidden sm:inline">Todo App</span>
      </a>

      <!-- Desktop Navigation -->
      <nav
        class="hidden md:flex items-center gap-1"
        aria-label="メインナビゲーション"
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
            {item.label}
          </a>
        {/each}
      </nav>

      <!-- Mobile Menu Button -->
      <button
        onclick={toggleMenu}
        aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={menuOpen}
        class="md:hidden min-h-[44px] min-w-[44px] p-2 rounded-md text-foreground hover:bg-accent transition-colors"
      >
        {#if menuOpen}
          <!-- × Icon -->
          <svg
            class="w-6 h-6"
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
        {:else}
          <!-- Hamburger Icon -->
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        {/if}
      </button>
    </div>
  </div>
</header>

<!-- Mobile Menu Drawer -->
{#if menuOpen}
  <div
    class="fixed inset-0 z-50 bg-black/50 md:hidden"
    onclick={closeMenu}
    onkeydown={(e) => e.key === "Enter" && closeMenu()}
    role="button"
    tabindex="-1"
    aria-label="メニューを閉じる"
    transition:fade={{ duration: 200 }}
  >
    <div
      class="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-background shadow-2xl"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="ナビゲーションメニュー"
      tabindex="-1"
      transition:fly={{ x: -300, duration: 300, easing: quintOut }}
    >
      <!-- Menu Header -->
      <div
        class="flex items-center justify-between h-16 px-6 border-b border-border"
      >
        <a
          href="/"
          class="flex items-center gap-2 text-lg font-semibold text-foreground"
        >
          <svg
            class="w-6 h-6 text-primary"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5a1 1 0 112 0v4a1 1 0 11-2 0V5zm1 8a1 1 0 100 2 1 1 0 000-2z"
              clip-rule="evenodd"
            />
          </svg>
          <span>Todo App</span>
        </a>
        <button
          class="min-h-[44px] min-w-[44px] p-2 rounded-md hover:bg-accent transition-colors"
          onclick={closeMenu}
          aria-label="メニューを閉じる"
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

      <!-- Menu Navigation -->
      <nav class="flex flex-col p-6 space-y-2" aria-label="モバイルナビゲーション">
        {#each navItems as item (item.href)}
          <a
            href={item.href}
            onclick={closeMenu}
            class="flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium min-h-[44px]
                   {isActive(item.href)
              ? 'bg-primary/10 text-primary'
              : 'text-foreground hover:bg-accent'}
                   transition-colors"
          >
            {#if item.href === "/"}
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
                />
              </svg>
            {:else if item.href === "/tasks"}
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fill-rule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clip-rule="evenodd"
                />
              </svg>
            {/if}
            {item.label}
          </a>
        {/each}
      </nav>
    </div>
  </div>
{/if}
