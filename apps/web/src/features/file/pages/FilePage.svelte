<svelte:options runes={true} />

<script lang="ts">
import { t } from "$lib/i18n";
import { FileList, FileUploader } from "../components";
import { createFilesQuery, createUploadFileMutation } from "../queries";

const filesQuery = createFilesQuery();
const uploadMutation = createUploadFileMutation();

let uploadProgress = $state<{ loaded: number; total: number } | null>(null);

async function handleUpload(file: globalThis.File) {
  uploadProgress = { loaded: 0, total: file.size };
  try {
    await uploadMutation.mutateAsync({
      file,
      onProgress: (p: { loaded: number; total: number }) => {
        uploadProgress = p;
      },
    });
  } catch (err) {
    console.error("Upload failed:", err);
  } finally {
    uploadProgress = null;
  }
}
</script>

<div class="py-4 sm:py-6 lg:py-8">
  <div class="mb-6 sm:mb-8">
    <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">{$t.files.title}</h1>
    <p class="mt-1 text-sm sm:text-base text-muted-foreground">
      {$t.files.subtitle}
    </p>
  </div>

  {#if filesQuery.isError}
    <div class="bg-destructive/15 border border-destructive text-destructive-foreground px-4 py-3 rounded-lg mb-6">
      <strong>{$t.common.error}:</strong> {filesQuery.error?.message || $t.errors.unknownError}
    </div>
  {/if}

  {#if uploadMutation.isError}
    <div class="bg-destructive/15 border border-destructive text-destructive-foreground px-4 py-3 rounded-lg mb-6">
      <strong>{$t.files.uploadError}:</strong> {uploadMutation.error?.message || $t.errors.unknownError}
    </div>
  {/if}

  <div class="space-y-6">
    <FileUploader
      onUpload={handleUpload}
      isUploading={uploadMutation.isPending}
      progress={uploadProgress}
    />

    <FileList
      files={filesQuery.data ?? []}
      isLoading={filesQuery.isPending}
    />
  </div>
</div>
