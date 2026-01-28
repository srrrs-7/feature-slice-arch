import {
  responseBadRequest,
  responseCreated,
  responseDBAccessError,
} from "@api/lib/http";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { fileService } from "../service/index.ts";
import { presignSchema } from "../validator/index.ts";

export const presignHandler = new Hono().post(
  "/",
  zValidator("json", presignSchema, (result, c) => {
    if (!result.success) {
      return responseBadRequest(c, result.error.issues);
    }
    return;
  }),
  async (c) => {
    const input = c.req.valid("json");

    return fileService.presign(input).match(
      ({ file, uploadUrl, expiresIn }) =>
        responseCreated(c, {
          file: {
            id: file.id,
            fileName: file.fileName,
            contentType: file.contentType,
            status: file.status,
            expiresAt: file.expiresAt.toISOString(),
          },
          uploadUrl,
          expiresIn,
        }),
      (error) => {
        switch (error.type) {
          case "VALIDATION_ERROR":
            return responseBadRequest(c, error.message);
          case "INVALID_CONTENT_TYPE":
            return responseBadRequest(
              c,
              `Invalid content type: ${error.contentType}`,
            );
          case "S3_ERROR":
            return responseDBAccessError(c, {
              message: "Failed to generate upload URL",
            });
          case "DATABASE_ERROR":
            return responseDBAccessError(c);
          default:
            return responseDBAccessError(c, { message: "Unexpected error" });
        }
      },
    );
  },
);
