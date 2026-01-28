import { Hono } from "hono";
import { completeHandler } from "./complete-handler.ts";
import { getAllHandler } from "./get-all-handler.ts";
import { getHandler } from "./get-handler.ts";
import { presignHandler } from "./presign-handler.ts";

export const fileRoutes = new Hono()
  .route("/presign", presignHandler)
  .route("/", getAllHandler)
  .route("/", completeHandler)
  .route("/", getHandler);
