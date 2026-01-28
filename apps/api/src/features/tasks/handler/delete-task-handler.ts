import { responseNoContent, validateParam } from "@api/lib/http";
import { Hono } from "hono";
import { taskService } from "../service/service.ts";
import { idParamSchema } from "../validator/validator.ts";
import { handleTaskError } from "./handle-task-error.ts";

export default new Hono().delete(
  "/:id",
  validateParam(idParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");

    return taskService.delete(id).match(
      () => responseNoContent(c),
      (error) => handleTaskError(error, c),
    );
  },
);
