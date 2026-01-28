export type FileId = string;
export type FileStatus = "pending" | "uploaded" | "failed";

export interface File {
  readonly id: FileId;
  readonly fileName: string;
  readonly contentType: string;
  readonly fileSize: number | null;
  readonly status: FileStatus;
  readonly expiresAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PresignFileResponse {
  readonly id: FileId;
  readonly fileName: string;
  readonly contentType: string;
  readonly status: FileStatus;
  readonly expiresAt: string;
}

export interface PresignResult {
  readonly file: PresignFileResponse;
  readonly uploadUrl: string;
  readonly expiresIn: number;
}

export interface CompleteFileResponse {
  readonly id: FileId;
  readonly fileName: string;
  readonly contentType: string;
  readonly fileSize: number | null;
  readonly status: FileStatus;
}

export interface PresignInput {
  fileName: string;
  contentType: string;
}

export interface CompleteInput {
  fileSize?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
