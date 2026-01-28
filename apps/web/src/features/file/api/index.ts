import type {
  CompleteFileResponse,
  CompleteInput,
  File,
  PresignInput,
  PresignResult,
} from "../types";
import { filesApi } from "./client";

export async function getFiles(): Promise<{ files: File[] }> {
  const res = await filesApi.$get();
  if (!res.ok) throw new Error(`Failed to fetch files: ${res.statusText}`);
  const data = await res.json();
  return data as { files: File[] };
}

export async function getFileById(id: string): Promise<{ file: File }> {
  const res = await filesApi[":id"].$get({ param: { id } });
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.statusText}`);
  const data = await res.json();
  return data as { file: File };
}

export async function presignFile(input: PresignInput): Promise<PresignResult> {
  const res = await filesApi.presign.$post({ json: input });
  if (!res.ok)
    throw new Error(`Failed to get presigned URL: ${res.statusText}`);
  const data = await res.json();
  return data as PresignResult;
}

export async function completeFile(
  id: string,
  input?: CompleteInput,
): Promise<{ file: CompleteFileResponse }> {
  const res = await filesApi[":id"].complete.$put({
    param: { id },
    json: input ?? {},
  });
  if (!res.ok) throw new Error(`Failed to complete upload: ${res.statusText}`);
  const data = await res.json();
  return data as { file: CompleteFileResponse };
}

export async function uploadToS3(
  url: string,
  file: Blob,
  contentType: string,
  onProgress?: (progress: { loaded: number; total: number }) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress({ loaded: e.loaded, total: e.total });
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}
