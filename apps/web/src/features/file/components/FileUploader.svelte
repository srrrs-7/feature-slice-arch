<svelte:options runes={true} />

<script lang="ts">
import * as Card from "@/components/ui/card";
import { t } from "$lib/i18n";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
];

interface Props {
  onUpload: (file: globalThis.File) => Promise<void>;
  isUploading?: boolean;
  progress?: { loaded: number; total: number } | null;
}

let { onUpload, isUploading = false, progress = null }: Props = $props();

let isDragging = $state(false);
let inputRef: HTMLInputElement | null = $state(null);

function handleDragEnter(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragging = true;
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragging = false;
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragging = false;

  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (file) {
      void handleFile(file);
    }
  }
}

function handleInputChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    void handleFile(file);
  }
  target.value = "";
}

async function handleFile(file: globalThis.File) {
  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
    alert($t.files.invalidFileType);
    return;
  }
  await onUpload(file);
}

function handleClick() {
  inputRef?.click();
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    inputRef?.click();
  }
}

const progressPercentage = $derived(
  progress ? Math.round((progress.loaded / progress.total) * 100) : 0,
);
</script>

<Card.Root class="w-full">
  <Card.Content class="p-4 sm:p-6">
    <div
      role="button"
      tabindex="0"
      class="relative border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors cursor-pointer
        {isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
        {isUploading ? 'pointer-events-none opacity-50' : ''}"
      ondragenter={handleDragEnter}
      ondragleave={handleDragLeave}
      ondragover={handleDragOver}
      ondrop={handleDrop}
      onclick={handleClick}
      onkeydown={handleKeyDown}
    >
      <input
        bind:this={inputRef}
        type="file"
        accept={ALLOWED_CONTENT_TYPES.join(",")}
        class="hidden"
        onchange={handleInputChange}
        disabled={isUploading}
      />

      {#if isUploading}
        <div class="space-y-3">
          <div class="animate-spin mx-auto h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          <p class="text-sm text-muted-foreground">{$t.files.uploading}</p>
          {#if progress}
            <div class="w-full max-w-xs mx-auto">
              <div class="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary transition-all duration-200"
                  style="width: {progressPercentage}%"
                ></div>
              </div>
              <p class="text-xs text-muted-foreground mt-1">{progressPercentage}%</p>
            </div>
          {/if}
        </div>
      {:else}
        <div class="space-y-2">
          <svg
            class="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <p class="text-sm sm:text-base font-medium">{$t.files.dropzone}</p>
          <p class="text-xs sm:text-sm text-muted-foreground">{$t.files.dropzoneHint}</p>
          <p class="text-xs text-muted-foreground mt-2">{$t.files.allowedTypes}</p>
        </div>
      {/if}
    </div>
  </Card.Content>
</Card.Root>
