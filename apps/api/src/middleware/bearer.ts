import { responseUnauthorized } from "@api/lib/http";
import type { MiddlewareHandler } from "hono";

export const bearerAuthMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return responseUnauthorized(c, {
      message: "Authorization header required",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return responseUnauthorized(c, { message: "Invalid authorization format" });
  }

  const token = authHeader.slice(7);

  if (!token) {
    return responseUnauthorized(c, { message: "Token required" });
  }

  await next();
};
