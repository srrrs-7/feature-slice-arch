import type { File as PrismaFile } from "@api/lib/db";
import { prisma, wrapAsyncWithLog } from "@api/lib/db";
import { isDatabaseNotFound } from "@api/lib/error";
import { err, ok, type ResultAsync } from "neverthrow";
import {
  type CreateFileInput,
  createFile,
  createFileId,
  type File,
  type FileError,
  FileErrors,
  type FileId,
  type FileStatus,
} from "../domain/index.ts";

const toDomain = (prismaFile: PrismaFile): File =>
  createFile({
    id: createFileId(prismaFile.id),
    fileName: prismaFile.fileName,
    contentType: prismaFile.contentType,
    fileSize: prismaFile.fileSize,
    s3Key: prismaFile.s3Key,
    status: prismaFile.status as FileStatus,
    expiresAt: prismaFile.expiresAt,
    createdAt: prismaFile.createdAt,
    updatedAt: prismaFile.updatedAt,
  });

const findById = (id: FileId): ResultAsync<File, FileError> =>
  wrapAsyncWithLog(
    "fileRepository.findById",
    { id },
    () => prisma.file.findUnique({ where: { id: id as string } }),
    FileErrors.database,
  ).andThen((file) =>
    file ? ok(toDomain(file)) : err(FileErrors.notFound(id)),
  );

const create = (input: CreateFileInput): ResultAsync<File, FileError> =>
  wrapAsyncWithLog(
    "fileRepository.create",
    { fileName: input.fileName, contentType: input.contentType },
    () =>
      prisma.file.create({
        data: {
          fileName: input.fileName,
          contentType: input.contentType,
          s3Key: input.s3Key,
          status: "pending",
          expiresAt: input.expiresAt,
        },
      }),
    FileErrors.database,
  ).map(toDomain);

const updateStatus = (
  id: FileId,
  status: FileStatus,
  fileSize?: number,
): ResultAsync<File, FileError> =>
  wrapAsyncWithLog(
    "fileRepository.updateStatus",
    { id, status, fileSize },
    () =>
      prisma.file.update({
        where: { id: id as string },
        data: {
          status,
          ...(fileSize !== undefined && { fileSize }),
        },
      }),
    FileErrors.database,
  )
    .map(toDomain)
    .mapErr((error) =>
      isDatabaseNotFound(error) ? FileErrors.notFound(id) : error,
    );

const findAll = (): ResultAsync<File[], FileError> =>
  wrapAsyncWithLog(
    "fileRepository.findAll",
    {},
    () =>
      prisma.file.findMany({
        where: { status: "uploaded" },
        orderBy: { createdAt: "desc" },
      }),
    FileErrors.database,
  ).map((files) => files.map(toDomain));

export const fileRepository = {
  findById,
  findAll,
  create,
  updateStatus,
} as const;
