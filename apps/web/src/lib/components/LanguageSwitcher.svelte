<script lang="ts">
import type { Locale } from "$lib/i18n";
import { locale, SUPPORTED_LOCALES, setLocale, t } from "$lib/i18n";

interface Props {
  /** Compact mode for mobile */
  compact?: boolean;
  /** Additional CSS classes */
  class?: string;
}

let { compact = false, class: className = "" }: Props = $props();

let isOpen = $state(false);

function toggleDropdown() {
  isOpen = !isOpen;
}

function selectLocale(newLocale: Locale) {
  setLocale(newLocale);
  isOpen = false;
}

function handleKeydown(event: KeyboardEvent, localeCode: Locale) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    selectLocale(localeCode);
  }
  if (event.key === "Escape") {
    isOpen = false;
  }
}

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest(".language-switcher")) {
    isOpen = false;
  }
}

$effect(() => {
  if (isOpen) {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }
});

// Get current locale info
const currentLocale = $derived(
  SUPPORTED_LOCALES.find((l) => l.code === $locale) ?? SUPPORTED_LOCALES[0],
);
</script>

<div class="language-switcher relative {className}">
  <button
    type="button"
    onclick={toggleDropdown}
    aria-expanded={isOpen}
    aria-haspopup="listbox"
    aria-label={$t.language.label}
    class="
      flex items-center gap-1.5 sm:gap-2
      min-h-[44px] px-2 sm:px-3 py-2
      text-sm font-medium
      rounded-md
      text-foreground
      hover:bg-accent
      transition-colors
      {compact ? 'justify-center' : ''}
    "
  >
    <span class="text-base" aria-hidden="true">{currentLocale.flag}</span>
    {#if !compact}
      <span class="hidden sm:inline">{currentLocale.nativeName}</span>
    {/if}
    <svg
      class="w-4 h-4 transition-transform {isOpen ? 'rotate-180' : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </button>

  {#if isOpen}
    <ul
      role="listbox"
      aria-label={$t.language.label}
      class="
        absolute right-0 z-50 mt-1
        min-w-[140px]
        bg-background
        border border-border
        rounded-md shadow-lg
        py-1
        overflow-hidden
      "
    >
      {#each SUPPORTED_LOCALES as localeInfo (localeInfo.code)}
        <li
          role="option"
          aria-selected={$locale === localeInfo.code}
          tabindex="0"
          onclick={() => selectLocale(localeInfo.code)}
          onkeydown={(e) => handleKeydown(e, localeInfo.code)}
          class="
            flex items-center gap-2
            px-3 py-2
            text-sm
            cursor-pointer
            hover:bg-accent
            transition-colors
            {$locale === localeInfo.code
            ? 'bg-accent/50 font-medium'
            : ''}
          "
        >
          <span class="text-base" aria-hidden="true">{localeInfo.flag}</span>
          <span>{localeInfo.nativeName}</span>
          {#if $locale === localeInfo.code}
            <svg
              class="w-4 h-4 ml-auto text-primary"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
