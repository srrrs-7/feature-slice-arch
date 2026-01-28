import { responseDBAccessError, responseOk } from "@api/lib/http";
import { Hono } from "hono";
import { fileService } from "../service/index.ts";

const toResponse = (file: {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number | null;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: file.id,
  fileName: file.fileName,
  contentType: file.contentType,
  fileSize: file.fileSize,
  status: file.status,
  expiresAt: file.expiresAt.toISOString(),
  createdAt: file.createdAt.toISOString(),
  updatedAt: file.updatedAt.toISOString(),
});

export const getAllHandler = new Hono().get("/", async (c) => {
  return fileService.getAll().match(
    (files) => responseOk(c, { files: files.map(toResponse) }),
    (_error) => responseDBAccessError(c),
  );
});
