import { responseDBAccessError, responseOk } from "@api/lib/http";
import { Hono } from "hono";
import { fileService } from "../service/index.ts";
import { toFileResponse } from "./file-response.ts";

export const getAllHandler = new Hono().get("/", async (c) => {
  return fileService.getAll().match(
    (files) => responseOk(c, { files: files.map(toFileResponse) }),
    (_error) => responseDBAccessError(c),
  );
});
