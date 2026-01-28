import {
  responseBadRequest,
  responseDBAccessError,
  responseNotFound,
  responseOk,
  validateParam,
} from "@api/lib/http";
import { Hono } from "hono";
import { fileService } from "../service/index.ts";
import { idParamSchema } from "../validator/index.ts";

export const viewUrlHandler = new Hono().get(
  "/:id/view-url",
  validateParam(idParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");

    return fileService.getViewUrl(id).match(
      (result) =>
        responseOk(c, {
          viewUrl: result.viewUrl,
          expiresIn: result.expiresIn,
          contentType: result.contentType,
        }),
      (error) => {
        switch (error.type) {
          case "FILE_NOT_FOUND":
            return responseNotFound(c, { message: "File not found" });
          case "VALIDATION_ERROR":
            return responseBadRequest(c, error.message);
          case "S3_ERROR":
            return responseDBAccessError(c, {
              message: "Failed to generate view URL",
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
