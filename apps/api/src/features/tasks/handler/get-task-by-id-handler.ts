import { responseOk, validateParam } from "@api/lib/http";
import { Hono } from "hono";
import { taskService } from "../service/service.ts";
import { idParamSchema } from "../validator/validator.ts";
import { handleTaskError } from "./handle-task-error.ts";

export default new Hono().get(
  "/:id",
  validateParam(idParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");

    return taskService.getById(id).match(
      (task) => responseOk(c, { task }),
      (error) => handleTaskError(error, c),
    );
  },
);
