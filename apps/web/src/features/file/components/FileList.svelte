<svelte:options runes={true} />

<script lang="ts">
import { t } from "$lib/i18n";
import type { File } from "../types";
import FileCard from "./FileCard.svelte";

interface Props {
  files: File[];
  isLoading?: boolean;
}

let { files, isLoading = false }: Props = $props();
</script>

{#if isLoading && files.length === 0}
  <div class="flex justify-center py-8 sm:py-12">
    <div class="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
  </div>
{:else if files.length === 0}
  <div class="text-center py-8 sm:py-12">
    <svg
      class="mx-auto h-12 w-12 text-muted-foreground"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
    <p class="mt-4 text-sm sm:text-base font-medium text-muted-foreground">
      {$t.files.noFiles}
    </p>
    <p class="mt-1 text-xs sm:text-sm text-muted-foreground">
      {$t.files.noFilesDescription}
    </p>
  </div>
{:else}
  <div class="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
    {#each files as file (file.id)}
      <FileCard {file} />
    {/each}
  </div>
{/if}
