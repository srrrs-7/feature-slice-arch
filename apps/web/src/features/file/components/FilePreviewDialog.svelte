<svelte:options runes={true} />

<script lang="ts">
import { Button } from "@/components/ui/button";
import * as Dialog from "@/components/ui/dialog";
import { createViewUrlQuery } from "../queries";
import type { File } from "../types";

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

const isImage = $derived(file?.contentType.startsWith("image/") ?? false);
const isPdf = $derived(file?.contentType === "application/pdf");
const isText = $derived(file?.contentType.startsWith("text/") ?? false);

function handleDownload() {
  if (viewUrl) {
    window.open(viewUrl, "_blank");
  }
}
</script>

<Dialog.Root {open} onOpenChange={(isOpen) => !isOpen && onClose()}>
  <Dialog.Content class="max-w-7xl w-full p-0 overflow-hidden bg-white">
    <Dialog.Header class="p-4 border-b">
      <Dialog.Title class="text-lg font-semibold line-clamp-1">
        {file?.fileName ?? ""}
      </Dialog.Title>
      <Dialog.Description class="text-muted-foreground text-sm">
        {file?.contentType ?? ""}
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex items-center justify-center min-h-[60vh] max-h-[80vh] p-6 bg-muted/30">
      {#if isPending}
        <div class="animate-pulse bg-muted w-full h-80 rounded-lg"></div>
      {:else if viewUrl}
        {#if isImage}
          <img
            src={viewUrl}
            alt={file?.fileName ?? "Preview"}
            class="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg"
          />
        {:else if isPdf}
          <iframe
            src={viewUrl}
            title={file?.fileName ?? "PDF Preview"}
            class="w-full h-[75vh] rounded-lg border"
          ></iframe>
        {:else if isText}
          <iframe
            src={viewUrl}
            title={file?.fileName ?? "Text Preview"}
            class="w-full h-[75vh] rounded-lg border bg-white font-mono text-sm"
          ></iframe>
        {:else}
          <div class="text-center py-12">
            <p class="text-muted-foreground mb-4">Preview not available for this file type</p>
            <Button onclick={handleDownload}>Download File</Button>
          </div>
        {/if}
      {:else}
        <p class="text-muted-foreground">Failed to load file</p>
      {/if}
    </div>

    <Dialog.Footer class="p-4 border-t">
      <Button variant="outline" onclick={onClose}>Close</Button>
      {#if viewUrl}
        <Button class="bg-neutral-700 hover:bg-neutral-800 text-white" onclick={handleDownload}>Download</Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
