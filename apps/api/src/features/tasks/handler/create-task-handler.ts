import { responseCreated, validateJson } from "@api/lib/http";
import { Hono } from "hono";
import { taskService } from "../service/service.ts";
import { createTaskSchema } from "../validator/validator.ts";
import { handleTaskError } from "./handle-task-error.ts";

export default new Hono().post(
  "/",
  validateJson(createTaskSchema),
  async (c) => {
    const input = c.req.valid("json");

    return taskService.create(input).match(
      (task) => responseCreated(c, { task }),
      (error) => handleTaskError(error, c),
    );
  },
);
