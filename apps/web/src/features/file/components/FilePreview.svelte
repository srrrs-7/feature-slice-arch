<svelte:options runes={true} />

<script lang="ts">
import { createViewUrlQuery } from "../queries";
import {
  isImageContentType,
  isPdfContentType,
  isTextContentType,
} from "../utils";

interface Props {
  fileId?: string;
  contentType: string;
  fileName: string;
  class?: string;
}

let { fileId, contentType, fileName, class: className = "" }: Props = $props();

const isImage = $derived(isImageContentType(contentType));
const isPdf = $derived(isPdfContentType(contentType));
const isText = $derived(isTextContentType(contentType));

const viewUrlQuery = createViewUrlQuery(() => fileId ?? "", {
  enabled: () => isImage && !!fileId,
});

let imageLoaded = $state(false);
let imageError = $state(false);

const viewUrl = $derived(viewUrlQuery.data?.viewUrl);
const isPending = $derived(viewUrlQuery.isPending);
</script>

<div
  class="relative flex items-center justify-center bg-muted rounded-md overflow-hidden {className}"
>
  {#if isImage && fileId && viewUrl && !imageError}
    {#if !imageLoaded}
      <div class="absolute inset-0 animate-pulse bg-muted"></div>
    {/if}
    <img
      src={viewUrl}
      alt={fileName}
      class="w-full h-full object-cover"
      class:opacity-0={!imageLoaded}
      class:opacity-100={imageLoaded}
      class:transition-opacity={true}
      class:duration-200={true}
      onload={() => (imageLoaded = true)}
      onerror={() => (imageError = true)}
    />
  {:else if isImage && fileId && isPending}
    <div class="animate-pulse bg-muted w-full h-full"></div>
  {:else if isImage}
    <svg
      class="h-8 w-8 text-green-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  {:else if isPdf}
    <svg
      class="h-8 w-8 text-red-600"
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
  {:else if isText}
    <svg
      class="h-8 w-8 text-blue-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  {:else}
    <svg
      class="h-8 w-8 text-muted-foreground"
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
  {/if}
</div>
