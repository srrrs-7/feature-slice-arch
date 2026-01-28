import type { File } from "../domain/file.ts";

export type FileResponse = {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export const toFileResponse = (file: File): FileResponse => ({
  id: file.id,
  fileName: file.fileName,
  contentType: file.contentType,
  fileSize: file.fileSize,
  status: file.status,
  expiresAt: file.expiresAt.toISOString(),
  createdAt: file.createdAt.toISOString(),
  updatedAt: file.updatedAt.toISOString(),
});
