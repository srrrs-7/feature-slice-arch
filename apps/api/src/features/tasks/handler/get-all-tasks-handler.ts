import { responseDBAccessError, responseOk } from "@api/lib/http";
import { Hono } from "hono";
import { taskService } from "../service/service.ts";

export default new Hono().get("/", async (c) => {
  return taskService.getAll().match(
    (tasks) => responseOk(c, { tasks }),
    (error) => {
      switch (error.type) {
        case "DATABASE_ERROR":
          return responseDBAccessError(c, { message: "Database error" });
        default:
          return responseDBAccessError(c, { message: "Unexpected error" });
      }
    },
  );
});
