import { responseOk, validateJson, validateParam } from "@api/lib/http";
import { Hono } from "hono";
import { taskService } from "../service/service.ts";
import { idParamSchema, updateTaskSchema } from "../validator/validator.ts";
import { handleTaskError } from "./handle-task-error.ts";

export default new Hono().put(
  "/:id",
  validateParam(idParamSchema),
  validateJson(updateTaskSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");

    return taskService.update(id, input).match(
      (task) => responseOk(c, { task }),
      (error) => handleTaskError(error, c),
    );
  },
);
