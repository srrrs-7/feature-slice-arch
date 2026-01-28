import {
  createMutation,
  createQuery,
  useQueryClient,
} from "@tanstack/svelte-query";
import { queryKeys } from "$lib/query";
import * as api from "../api";
import type { CompleteFileResponse, File, ViewUrlResponse } from "../types";

export function createFilesQuery() {
  return createQuery<File[]>(() => ({
    queryKey: queryKeys.files.lists(),
    queryFn: async () => {
      const data = await api.getFiles();
      return data.files;
    },
  }));
}

export function createFileQuery(id: () => string) {
  return createQuery<File>(() => ({
    queryKey: queryKeys.files.detail(id()),
    queryFn: async () => {
      const data = await api.getFileById(id());
      return data.file;
    },
    enabled: !!id(),
  }));
}

export function createViewUrlQuery(
  id: () => string,
  options?: { enabled?: () => boolean },
) {
  return createQuery<ViewUrlResponse>(() => ({
    queryKey: queryKeys.files.previewUrl(id()),
    queryFn: async () => {
      return api.getViewUrl(id());
    },
    enabled: options?.enabled?.() ?? !!id(),
    staleTime: 30 * 60 * 1000, // 30 minutes (URL is valid for 1 hour)
    gcTime: 60 * 60 * 1000, // 1 hour
  }));
}

export function createUploadFileMutation() {
  const queryClient = useQueryClient();

  return createMutation<
    CompleteFileResponse,
    Error,
    {
      file: globalThis.File;
      onProgress?: (progress: { loaded: number; total: number }) => void;
    }
  >(() => ({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: globalThis.File;
      onProgress?: (progress: { loaded: number; total: number }) => void;
    }) => {
      const presignResult = await api.presignFile({
        fileName: file.name,
        contentType: file.type,
      });

      await api.uploadToS3(
        presignResult.uploadUrl,
        file,
        file.type,
        onProgress,
      );

      const result = await api.completeFile(presignResult.file.id, {
        fileSize: file.size,
      });
      return result.file;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.files.lists() });
    },
  }));
}
