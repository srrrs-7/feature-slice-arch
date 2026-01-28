<svelte:options runes={true} />

<script lang="ts">
import { Button } from "@/components/ui/button";
import * as Dialog from "@/components/ui/dialog";
import { createViewUrlQuery } from "../queries";
import type { File } from "../types";
import {
  isImageContentType,
  isPdfContentType,
  isTextContentType,
} from "../utils";

interface Props {
  open?: boolean;
  file?: File;
  onClose: () => void;
}

let { open = false, file, onClose }: Props = $props();

const viewUrlQuery = createViewUrlQuery(() => file?.id ?? "", {
  enabled: () => open && !!file?.id,
});

const viewUrl = $derived(viewUrlQuery.data?.viewUrl);
const isPending = $derived(viewUrlQuery.isPending);
const contentType = $derived(file?.contentType ?? "");

const isImage = $derived(isImageContentType(contentType));
const isPdf = $derived(isPdfContentType(contentType));
const isText = $derived(isTextContentType(contentType));
const canPreview = $derived(isImage || isPdf || isText);

function handleDownload() {
  if (viewUrl) {
    window.open(viewUrl, "_blank");
  }
}
</script>

<Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && onClose()}>
  <Dialog.Content class="w-[85vh] h-[70vh] max-w-[90vw] p-0 overflow-hidden bg-white flex flex-col">
    <Dialog.Header class="p-4 border-b shrink-0">
      <Dialog.Title class="text-lg font-semibold line-clamp-1">
        {file?.fileName ?? ""}
      </Dialog.Title>
      <Dialog.Description class="text-muted-foreground text-sm">
        {contentType}
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex-1 flex items-center justify-center p-6 bg-muted/30 overflow-hidden min-h-0">
      {#if isPending}
        <div class="animate-pulse bg-muted w-full h-full rounded-lg"></div>
      {:else if viewUrl && canPreview}
        {#if isImage}
          <img
            src={viewUrl}
            alt={file?.fileName ?? "Preview"}
            class="max-w-full max-h-full object-contain rounded-lg shadow-lg"
          />
        {:else if isPdf}
          <iframe
            src={viewUrl}
            title={file?.fileName ?? "PDF Preview"}
            class="w-full h-full rounded-lg border"
          ></iframe>
        {:else if isText}
          <iframe
            src={viewUrl}
            title={file?.fileName ?? "Text Preview"}
            class="w-full h-full rounded-lg border bg-white font-mono text-sm"
          ></iframe>
        {/if}
      {:else if viewUrl}
        <div class="text-center py-12">
          <p class="text-muted-foreground mb-4">Preview not available for this file type</p>
          <Button onclick={handleDownload}>Download File</Button>
        </div>
      {:else}
        <p class="text-muted-foreground">Failed to load file</p>
      {/if}
    </div>

    <Dialog.Footer class="p-4 border-t shrink-0">
      <Button variant="outline" onclick={onClose}>Close</Button>
      {#if viewUrl}
        <Button class="bg-neutral-700 hover:bg-neutral-800 text-white" onclick={handleDownload}>Download</Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
