import { Hono } from "hono";
import createTaskHandler from "./create-task-handler.ts";
import deleteTaskHandler from "./delete-task-handler.ts";
import getAllTasksHandler from "./get-all-tasks-handler.ts";
import getTaskByIdHandler from "./get-task-by-id-handler.ts";
import updateTaskHandler from "./update-task-handler.ts";

export default new Hono()
  .route("/", getAllTasksHandler)
  .route("/", getTaskByIdHandler)
  .route("/", createTaskHandler)
  .route("/", updateTaskHandler)
  .route("/", deleteTaskHandler);
