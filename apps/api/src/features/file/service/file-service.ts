import {
  generatePresignedUploadUrl,
  generateS3Key,
  type PresignedUrlResult,
} from "@api/lib/s3/presign";
import { dayjs } from "@api/lib/time";
import {
  err,
  errAsync,
  ok,
  okAsync,
  type Result,
  ResultAsync,
  type ResultAsync as ResultAsyncType,
} from "neverthrow";
import { z } from "zod";
import {
  createFileId,
  type File,
  type FileError,
  FileErrors,
} from "../domain/index.ts";
import { fileRepository } from "../repository/index.ts";

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
] as const;

type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

const PRESIGNED_URL_EXPIRY_SECONDS = 180;

const fileIdSchema = z
  .string()
  .trim()
  .min(1, "File ID cannot be empty")
  .transform((id) => createFileId(id));

const fileNameSchema = z
  .string()
  .trim()
  .min(1, "File name cannot be empty")
  .max(255, "File name must be 255 characters or less");

const contentTypeSchema = z.enum(ALLOWED_CONTENT_TYPES, "Invalid content type");

const presignInputSchema = z.object({
  fileName: fileNameSchema,
  contentType: contentTypeSchema,
});

const parseWith = <T>(
  schema: z.ZodType<T>,
  data: unknown,
): Result<T, FileError> => {
  const result = schema.safeParse(data);
  if (result.success) {
    return ok(result.data);
  }
  const firstIssue = result.error.issues[0];
  return err(FileErrors.validation(firstIssue?.message ?? "Validation failed"));
};

const liftAsync = <T, E>(result: Result<T, E>): ResultAsyncType<T, E> =>
  result.match(
    (value) => okAsync(value),
    (error) => errAsync(error),
  );

export interface PresignResult {
  readonly file: File;
  readonly uploadUrl: string;
  readonly expiresIn: number;
}

export const presign = (input: {
  fileName: string;
  contentType: string;
}): ResultAsyncType<PresignResult, FileError> =>
  liftAsync(parseWith(presignInputSchema, input)).andThen(
    ({
      fileName,
      contentType,
    }: {
      fileName: string;
      contentType: AllowedContentType;
    }) => {
      const tempId = crypto.randomUUID();
      const s3Key = generateS3Key(tempId, fileName);

      return ResultAsync.fromPromise<PresignedUrlResult, FileError>(
        generatePresignedUploadUrl(
          s3Key,
          contentType,
          PRESIGNED_URL_EXPIRY_SECONDS,
        ),
        (e) => FileErrors.s3(e),
      ).andThen((presignResult: PresignedUrlResult) =>
        fileRepository
          .create({
            fileName,
            contentType,
            s3Key,
            expiresAt: presignResult.expiresAt,
          })
          .map(
            (file): PresignResult => ({
              file,
              uploadUrl: presignResult.url,
              expiresIn: presignResult.expiresIn,
            }),
          ),
      );
    },
  );

export const complete = (
  id: string,
  fileSize?: number,
): ResultAsyncType<File, FileError> =>
  liftAsync(parseWith(fileIdSchema, id)).andThen((fileId) =>
    fileRepository.findById(fileId).andThen((file) => {
      if (file.status === "uploaded") {
        return errAsync(FileErrors.alreadyCompleted(fileId));
      }
      if (file.status === "failed" || dayjs().isAfter(file.expiresAt)) {
        return errAsync(FileErrors.expired(fileId));
      }
      return fileRepository.updateStatus(fileId, "uploaded", fileSize);
    }),
  );

export const getById = (id: string): ResultAsyncType<File, FileError> =>
  liftAsync(parseWith(fileIdSchema, id)).andThen(fileRepository.findById);

export const getAll = (): ResultAsyncType<File[], FileError> =>
  fileRepository.findAll();

export const fileService = {
  presign,
  complete,
  getById,
  getAll,
} as const;
