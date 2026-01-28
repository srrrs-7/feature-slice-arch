import {
  responseBadRequest,
  responseDBAccessError,
  responseNotFound,
} from "@api/lib/http";
import type { Context } from "hono";
import type { TaskError } from "../domain/task.ts";

export const handleTaskError = (error: TaskError, c: Context) => {
  switch (error.type) {
    case "NOT_FOUND":
      return responseNotFound(c, {
        message: "Task not found",
      });
    case "VALIDATION_ERROR":
      return responseBadRequest(c, error.message);
    case "ALREADY_EXISTS":
      return responseBadRequest(c, "Task already exists");
    case "DATABASE_ERROR":
      return responseDBAccessError(c);
    default:
      return responseDBAccessError(c, { message: "Unexpected error" });
  }
};
