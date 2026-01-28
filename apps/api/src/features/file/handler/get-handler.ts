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
import { toFileResponse } from "./file-response.ts";

export const getHandler = new Hono().get(
  "/:id",
  validateParam(idParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");

    return fileService.getById(id).match(
      (file) =>
        responseOk(c, {
          file: toFileResponse(file),
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
