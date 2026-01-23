import type { Context } from "hono";
import type { z } from "zod";

// Response helpers for Hono

export const responseOk = <T>(c: Context, data: T) => c.json(data, 200);

export const responseCreated = <T>(c: Context, data: T) => c.json(data, 201);

export const responseNoContent = (c: Context) => c.body(null, 204);

export const responseBadRequest = (
  c: Context,
  issues: z.ZodIssue[] | string,
) => {
  const message = typeof issues === "string" ? issues : formatZodIssues(issues);
  return c.json({ error: "BAD_REQUEST", message }, 400);
};

export const responseNotFound = (
  c: Context,
  error: { message?: string } = {},
) => c.json({ error: "NOT_FOUND", message: error.message ?? "Not found" }, 404);

export const responseConflict = (
  c: Context,
  error: { message?: string } = {},
) => c.json({ error: "CONFLICT", message: error.message ?? "Conflict" }, 409);

export const responseDBAccessError = (
  c: Context,
  error: { message?: string } = {},
) =>
  c.json(
    {
      error: "DATABASE_ERROR",
      message: error.message ?? "Database error occurred",
    },
    500,
  );

export const responseUnexpectedError = (c: Context, _error: unknown = {}) =>
  c.json(
    { error: "INTERNAL_SERVER_ERROR", message: "Unexpected error occurred" },
    500,
  );

export const responseUnauthorized = (
  c: Context,
  error: { message?: string } = {},
) =>
  c.json(
    { error: "UNAUTHORIZED", message: error.message ?? "Unauthorized" },
    401,
  );

export const responseForbidden = (
  c: Context,
  error: { message?: string } = {},
) => c.json({ error: "FORBIDDEN", message: error.message ?? "Forbidden" }, 403);

// Helper to format zod issues into readable message
const formatZodIssues = (issues: z.ZodIssue[]): string =>
  issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
