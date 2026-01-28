import {
  responseBadRequest,
  responseCreated,
  responseDBAccessError,
  validateJson,
} from "@api/lib/http";
import { Hono } from "hono";
import { fileService } from "../service/index.ts";
import { presignSchema } from "../validator/index.ts";

export const presignHandler = new Hono().post(
  "/",
  validateJson(presignSchema),
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
