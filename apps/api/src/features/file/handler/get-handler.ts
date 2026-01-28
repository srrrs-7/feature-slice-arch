import {
  responseBadRequest,
  responseDBAccessError,
  responseNotFound,
  responseOk,
} from "@api/lib/http";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { fileService } from "../service/index.ts";
import { idParamSchema } from "../validator/index.ts";

export const getHandler = new Hono().get(
  "/:id",
  zValidator("param", idParamSchema, (result, c) => {
    if (!result.success) {
      return responseBadRequest(c, result.error.issues);
    }
    return;
  }),
  async (c) => {
    const { id } = c.req.valid("param");

    return fileService.getById(id).match(
      (file) =>
        responseOk(c, {
          file: {
            id: file.id,
            fileName: file.fileName,
            contentType: file.contentType,
            fileSize: file.fileSize,
            status: file.status,
            expiresAt: file.expiresAt.toISOString(),
            createdAt: file.createdAt.toISOString(),
            updatedAt: file.updatedAt.toISOString(),
          },
        }),
      (error) => {
        switch (error.type) {
          case "FILE_NOT_FOUND":
            return responseNotFound(c, { message: "File not found" });
          case "VALIDATION_ERROR":
            return responseBadRequest(c, error.message);
          case "DATABASE_ERROR":
            return responseDBAccessError(c);
          default:
            return responseDBAccessError(c, { message: "Unexpected error" });
        }
      },
    );
  },
);
