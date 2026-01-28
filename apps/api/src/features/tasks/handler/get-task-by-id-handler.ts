import { responseBadRequest, responseOk } from "@api/lib/http";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { taskService } from "../service/service.ts";
import { idParamSchema } from "../validator/validator.ts";
import { handleTaskError } from "./handle-task-error.ts";

export default new Hono().get(
  "/:id",
  zValidator("param", idParamSchema, (result, c) => {
    if (!result.success) {
      return responseBadRequest(c, result.error.issues);
    }
    return;
  }),
  async (c) => {
    const { id } = c.req.valid("param");

    return taskService.getById(id).match(
      (task) => responseOk(c, { task }),
      (error) => handleTaskError(error, c),
    );
  },
);
