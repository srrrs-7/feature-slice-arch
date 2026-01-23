// Common error types for the API

/** Database error */
export type DatabaseError = {
  readonly type: "DATABASE_ERROR";
  readonly cause: unknown;
};

/** Validation error */
export type ValidationError = {
  readonly type: "VALIDATION_ERROR";
  readonly message: string;
};

/** Not found error */
export type NotFoundError = {
  readonly type: "NOT_FOUND";
  readonly resource: string;
  readonly id: string;
};

/** Unauthorized error */
export type UnauthorizedError = {
  readonly type: "UNAUTHORIZED";
  readonly message: string;
};

/** Forbidden error */
export type ForbiddenError = {
  readonly type: "FORBIDDEN";
  readonly message: string;
};

/** Base error type that all domain errors can extend */
export type BaseError =
  | DatabaseError
  | ValidationError
  | NotFoundError
  | UnauthorizedError
  | ForbiddenError;

/** Error constructors */
export const Errors = {
  database: (cause: unknown): DatabaseError => ({
    type: "DATABASE_ERROR",
    cause,
  }),
  validation: (message: string): ValidationError => ({
    type: "VALIDATION_ERROR",
    message,
  }),
  notFound: (resource: string, id: string): NotFoundError => ({
    type: "NOT_FOUND",
    resource,
    id,
  }),
  unauthorized: (message: string): UnauthorizedError => ({
    type: "UNAUTHORIZED",
    message,
  }),
  forbidden: (message: string): ForbiddenError => ({
    type: "FORBIDDEN",
    message,
  }),
} as const;

/** Generic error mapper for database operations */
export const toDbError = <E extends DatabaseError>(
  errorConstructor: (cause: unknown) => E,
): ((cause: unknown) => E) => errorConstructor;

/** Map error type to HTTP status code */
export const errorToHttpStatus = (error: { type: string }): number => {
  switch (error.type) {
    case "DATABASE_ERROR":
      return 500;
    case "VALIDATION_ERROR":
      return 400;
    case "NOT_FOUND":
      return 404;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    default:
      return 500;
  }
};

/** Check if error is a Prisma "not found" error (P2025) */
export const isPrismaNotFoundError = (cause: unknown): boolean =>
  cause instanceof Error && "code" in cause && cause.code === "P2025";

/** Check if error is a database error with Prisma not found */
export const isDatabaseNotFound = <E extends { type: string; cause?: unknown }>(
  error: E,
): boolean =>
  error.type === "DATABASE_ERROR" &&
  "cause" in error &&
  isPrismaNotFoundError(error.cause);
