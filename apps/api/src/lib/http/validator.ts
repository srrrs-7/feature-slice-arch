import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
import type { z } from "zod";
import { responseBadRequest } from "./response.ts";

type ValidationTarget = "json" | "param" | "query";
type ValidationFailureResult = {
  success: false;
  error: { issues: z.ZodIssue[] };
};
type ValidationFailureHandler = (
  result: ValidationFailureResult,
  c: Context,
) => Response | undefined;

const buildValidator = <
  Target extends ValidationTarget,
  Schema extends z.ZodTypeAny,
>(
  target: Target,
  schema: Schema,
  onError?: ValidationFailureHandler,
) =>
  zValidator(target, schema, (result, c) => {
    if (result.success) {
      return;
    }
    if (onError) {
      return onError(result, c);
    }
    return responseBadRequest(c, result.error.issues);
  });

export const validateJson = <Schema extends z.ZodTypeAny>(
  schema: Schema,
  onError?: ValidationFailureHandler,
) => buildValidator("json", schema, onError);

export const validateParam = <Schema extends z.ZodTypeAny>(
  schema: Schema,
  onError?: ValidationFailureHandler,
) => buildValidator("param", schema, onError);

export const validateQuery = <Schema extends z.ZodTypeAny>(
  schema: Schema,
  onError?: ValidationFailureHandler,
) => buildValidator("query", schema, onError);
