<svelte:options runes={true} />

<script lang="ts">
import { Badge } from "@/components/ui/badge";
import * as Card from "@/components/ui/card";
import { t } from "$lib/i18n";
import { formatDateCompact } from "$lib/utils/date";
import type { File } from "../types";
import FilePreview from "./FilePreview.svelte";

interface Props {
  file: File;
}

let { file }: Props = $props();

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getContentTypeLabel(contentType: string): string {
  const typeMap: Record<string, string> = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/gif": "GIF",
    "image/webp": "WebP",
    "application/pdf": "PDF",
    "text/plain": "TXT",
    "text/csv": "CSV",
  };
  return typeMap[contentType] ?? contentType;
}
</script>

<Card.Root class="overflow-hidden hover:shadow-md transition-shadow">
  <Card.Header class="p-4">
    <div class="flex items-start gap-3">
      <FilePreview
        contentType={file.contentType}
        fileName={file.fileName}
        class="w-12 h-12 flex-shrink-0"
      />
      <div class="flex-1 min-w-0">
        <Card.Title class="text-sm font-medium line-clamp-1" title={file.fileName}>
          {file.fileName}
        </Card.Title>
        <div class="flex items-center gap-2 mt-1">
          <Badge variant="secondary" class="text-xs">
            {getContentTypeLabel(file.contentType)}
          </Badge>
          <span class="text-xs text-muted-foreground">
            {formatFileSize(file.fileSize)}
          </span>
        </div>
      </div>
    </div>
  </Card.Header>
  <Card.Footer class="p-4 pt-0">
    <span class="text-xs text-muted-foreground">
      {$t.files.uploadedAt}: {formatDateCompact(file.createdAt)}
    </span>
  </Card.Footer>
</Card.Root>
