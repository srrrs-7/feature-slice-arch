<svelte:options runes={true} />

<script lang="ts">
import { Badge } from "@/components/ui/badge";
import { t } from "$lib/i18n";
import { formatDateCompact } from "$lib/utils/date";
import type { File } from "../types";
import { formatFileSize, getContentTypeLabel } from "../utils";
import FilePreview from "./FilePreview.svelte";
import FilePreviewDialog from "./FilePreviewDialog.svelte";

interface Props {
  file: File;
}

let { file }: Props = $props();

const isImage = $derived(file.contentType.startsWith("image/"));

let isPreviewOpen = $state(false);

function openPreview() {
  isPreviewOpen = true;
}

function closePreview() {
  isPreviewOpen = false;
}
</script>

<!-- Unified card layout for all file types -->
<button
  type="button"
  class="relative w-full aspect-[4/3] bg-card rounded-lg border shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
  onclick={openPreview}
>
  <!-- Preview area -->
  <div class="absolute inset-0">
    {#if isImage}
      <FilePreview
        fileId={file.id}
        contentType={file.contentType}
        fileName={file.fileName}
        class="w-full h-full"
      />
    {:else}
      <!-- Non-image: centered large icon -->
      <div class="w-full h-full flex items-center justify-center bg-muted/50">
        <FilePreview
          contentType={file.contentType}
          fileName={file.fileName}
          class="w-20 h-20"
        />
      </div>
    {/if}
  </div>

  <!-- Overlay metadata (gradient from bottom) -->
  <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent pointer-events-none">
    <div class="absolute bottom-0 left-0 right-0 p-3 text-left">
      <h3 class="text-sm font-semibold text-white line-clamp-1 drop-shadow-md" title={file.fileName}>
        {file.fileName}
      </h3>
      <div class="flex items-center gap-2 mt-1.5">
        <Badge variant="secondary" class="text-xs bg-white/20 text-white border-none">
          {getContentTypeLabel(file.contentType)}
        </Badge>
        <span class="text-xs text-white/90 drop-shadow-sm">
          {formatFileSize(file.fileSize)}
        </span>
      </div>
      <p class="text-xs text-white/80 mt-1 drop-shadow-sm">
        {$t.files.uploadedAt}: {formatDateCompact(file.createdAt)}
      </p>
    </div>
  </div>
</button>

<!-- File Preview Modal -->
<FilePreviewDialog open={isPreviewOpen} {file} onClose={closePreview} />
