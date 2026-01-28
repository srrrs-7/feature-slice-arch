import {
  responseBadRequest,
  responseDBAccessError,
  responseNotFound,
  responseOk,
} from "@api/lib/http";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { fileService } from "../service/index.ts";
import { completeSchema, idParamSchema } from "../validator/index.ts";

export const completeHandler = new Hono().put(
  "/:id/complete",
  zValidator("param", idParamSchema, (result, c) => {
    if (!result.success) {
      return responseBadRequest(c, result.error.issues);
    }
    return;
  }),
  zValidator("json", completeSchema, (result, c) => {
    if (!result.success) {
      return responseBadRequest(c, result.error.issues);
    }
    return;
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const { fileSize } = c.req.valid("json");

    return fileService.complete(id, fileSize).match(
      (file) =>
        responseOk(c, {
          file: {
            id: file.id,
            fileName: file.fileName,
            contentType: file.contentType,
            fileSize: file.fileSize,
            status: file.status,
          },
        }),
      (error) => {
        switch (error.type) {
          case "FILE_NOT_FOUND":
            return responseNotFound(c, { message: "File not found" });
          case "FILE_EXPIRED":
            return responseBadRequest(c, "File upload has expired");
          case "FILE_ALREADY_COMPLETED":
            return responseBadRequest(c, "File upload already completed");
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
