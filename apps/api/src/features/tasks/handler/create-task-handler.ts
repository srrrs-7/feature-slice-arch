import { responseBadRequest, responseCreated } from "@api/lib/http";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { taskService } from "../service/service.ts";
import { createTaskSchema } from "../validator/validator.ts";
import { handleTaskError } from "./handle-task-error.ts";

export default new Hono().post(
  "/",
  zValidator("json", createTaskSchema, (result, c) => {
    if (!result.success) {
      return responseBadRequest(c, result.error.issues);
    }
    return;
  }),
  async (c) => {
    const input = c.req.valid("json");

    return taskService.create(input).match(
      (task) => responseCreated(c, { task }),
      (error) => handleTaskError(error, c),
    );
  },
);
