import {
  responseBadRequest,
  responseCreated,
  responseDBAccessError,
  responseNoContent,
  responseNotFound,
  responseOk,
} from "@api/lib/http";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { taskService } from "./service/service.ts";
import {
  createTaskSchema,
  idParamSchema,
  updateTaskSchema,
} from "./validator.ts";

export default new Hono()
  // GET /api/tasks
  .get("/", async (c) => {
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
  })

  // GET /api/tasks/:id
  .get(
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
        (error) => {
          switch (error.type) {
            case "NOT_FOUND":
              return responseNotFound(c, {
                message: `Task not found: ${error.taskId}`,
              });
            case "VALIDATION_ERROR":
              return responseBadRequest(c, error.message);
            case "ALREADY_EXISTS":
              return responseBadRequest(
                c,
                `Task already exists: ${error.taskId}`,
              );
            case "DATABASE_ERROR":
              return responseDBAccessError(c);
          }
        },
      );
    },
  )

  // POST /api/tasks
  .post(
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
        (error) => {
          switch (error.type) {
            case "NOT_FOUND":
              return responseNotFound(c, {
                message: `Task not found: ${error.taskId}`,
              });
            case "VALIDATION_ERROR":
              return responseBadRequest(c, error.message);
            case "ALREADY_EXISTS":
              return responseBadRequest(
                c,
                `Task already exists: ${error.taskId}`,
              );
            case "DATABASE_ERROR":
              return responseDBAccessError(c);
          }
        },
      );
    },
  )

  // PUT /api/tasks/:id
  .put(
    "/:id",
    zValidator("param", idParamSchema, (result, c) => {
      if (!result.success) {
        return responseBadRequest(c, result.error.issues);
      }
      return;
    }),
    zValidator("json", updateTaskSchema, (result, c) => {
      if (!result.success) {
        return responseBadRequest(c, result.error.issues);
      }
      return;
    }),
    async (c) => {
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");

      return taskService.update(id, input).match(
        (task) => responseOk(c, { task }),
        (error) => {
          switch (error.type) {
            case "NOT_FOUND":
              return responseNotFound(c, {
                message: `Task not found: ${error.taskId}`,
              });
            case "VALIDATION_ERROR":
              return responseBadRequest(c, error.message);
            case "ALREADY_EXISTS":
              return responseBadRequest(
                c,
                `Task already exists: ${error.taskId}`,
              );
            case "DATABASE_ERROR":
              return responseDBAccessError(c);
          }
        },
      );
    },
  )

  // DELETE /api/tasks/:id
  .delete(
    "/:id",
    zValidator("param", idParamSchema, (result, c) => {
      if (!result.success) {
        return responseBadRequest(c, result.error.issues);
      }
      return;
    }),
    async (c) => {
      const { id } = c.req.valid("param");

      return taskService.delete(id).match(
        () => responseNoContent(c),
        (error) => {
          switch (error.type) {
            case "NOT_FOUND":
              return responseNotFound(c, {
                message: `Task not found: ${error.taskId}`,
              });
            case "VALIDATION_ERROR":
              return responseBadRequest(c, error.message);
            case "ALREADY_EXISTS":
              return responseBadRequest(
                c,
                `Task already exists: ${error.taskId}`,
              );
            case "DATABASE_ERROR":
              return responseDBAccessError(c);
          }
        },
      );
    },
  );
