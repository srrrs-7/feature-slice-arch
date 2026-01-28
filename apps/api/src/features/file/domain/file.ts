import {
  type DatabaseError,
  Errors,
  type ValidationError,
} from "@api/lib/error";

export type FileId = string & { readonly _brand: unique symbol };

export type FileStatus = "pending" | "uploaded" | "failed";

export interface File {
  readonly id: FileId;
  readonly fileName: string;
  readonly contentType: string;
  readonly fileSize: number | null;
  readonly s3Key: string;
  readonly status: FileStatus;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateFileInput {
  readonly fileName: string;
  readonly contentType: string;
  readonly s3Key: string;
  readonly expiresAt: Date;
}

export type FileNotFoundError = {
  readonly type: "FILE_NOT_FOUND";
  readonly fileId: FileId;
};

export type FileExpiredError = {
  readonly type: "FILE_EXPIRED";
  readonly fileId: FileId;
};

export type FileAlreadyCompletedError = {
  readonly type: "FILE_ALREADY_COMPLETED";
  readonly fileId: FileId;
};

export type InvalidContentTypeError = {
  readonly type: "INVALID_CONTENT_TYPE";
  readonly contentType: string;
};

export type S3Error = {
  readonly type: "S3_ERROR";
  readonly cause: unknown;
};

export type FileError =
  | DatabaseError
  | ValidationError
  | FileNotFoundError
  | FileExpiredError
  | FileAlreadyCompletedError
  | InvalidContentTypeError
  | S3Error;

export const createFileId = (id: string): FileId => id as FileId;

export const createFile = (params: {
  id: FileId;
  fileName: string;
  contentType: string;
  fileSize: number | null;
  s3Key: string;
  status: FileStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): File => Object.freeze(params);

export const FileErrors = {
  notFound: (fileId: FileId): FileNotFoundError => ({
    type: "FILE_NOT_FOUND",
    fileId,
  }),
  expired: (fileId: FileId): FileExpiredError => ({
    type: "FILE_EXPIRED",
    fileId,
  }),
  alreadyCompleted: (fileId: FileId): FileAlreadyCompletedError => ({
    type: "FILE_ALREADY_COMPLETED",
    fileId,
  }),
  invalidContentType: (contentType: string): InvalidContentTypeError => ({
    type: "INVALID_CONTENT_TYPE",
    contentType,
  }),
  s3: (cause: unknown): S3Error => ({
    type: "S3_ERROR",
    cause,
  }),
  validation: Errors.validation,
  database: Errors.database,
} as const;
