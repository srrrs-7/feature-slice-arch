<script lang="ts">
import { AppSidebar } from "@/features/feature/sidebar";
import LanguageSwitcher from "$lib/components/LanguageSwitcher.svelte";
import { t } from "$lib/i18n";

interface Props {
  /** Current route path for navigation highlighting */
  currentPath?: string;
  /** Content to render in main area */
  children?: import("svelte").Snippet;
}

let { currentPath = "/", children }: Props = $props();

// Sidebar state
let sidebarOpen = $state(false);
let sidebarCollapsed = $state(false);

/**
 * Toggle sidebar open/closed (mobile)
 */
function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
}

/**
 * Close sidebar (mobile)
 */
function closeSidebar() {
  sidebarOpen = false;
}

/**
 * Toggle sidebar collapsed state (desktop)
 */
function toggleCollapse() {
  sidebarCollapsed = !sidebarCollapsed;
}
</script>

<div class="min-h-screen bg-background">
  <!-- Mobile Header (shows menu button) -->
  <header class="lg:hidden sticky top-0 z-40 w-full bg-background shadow-md">
    <div class="container mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-16">
        <!-- Menu Button -->
        <button
          onclick={toggleSidebar}
          aria-label={sidebarOpen ? $t.nav.closeMenu : $t.nav.openMenu}
          aria-expanded={sidebarOpen}
          class="min-h-[44px] min-w-[44px] p-2 rounded-md text-foreground hover:bg-accent transition-colors"
        >
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
        </button>

        <!-- Logo -->
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
          <span>{$t.common.appName}</span>
        </a>

        <!-- Language Switcher -->
        <LanguageSwitcher compact />
      </div>
    </div>
  </header>

  <!-- Sidebar -->
  <AppSidebar
    {currentPath}
    open={sidebarOpen}
    collapsed={sidebarCollapsed}
    onClose={closeSidebar}
    onToggleCollapse={toggleCollapse}
  />

  <!-- Main Content (offset for desktop sidebar) -->
  <main
    class="min-h-screen transition-all duration-300 {sidebarCollapsed
      ? 'lg:pl-16'
      : 'lg:pl-64'}"
  >
    <div class="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
      {#if children}
        {@render children()}
      {/if}
    </div>
  </main>
</div>
