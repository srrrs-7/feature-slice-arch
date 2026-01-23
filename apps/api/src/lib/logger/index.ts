import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

// Sensitive fields to redact from logs
const redactPaths = [
  "password",
  "*.password",
  "secret",
  "*.secret",
  "token",
  "*.token",
  "accessToken",
  "*.accessToken",
  "refreshToken",
  "*.refreshToken",
  "authorization",
  "*.authorization",
  "Authorization",
  "*.Authorization",
  "apiKey",
  "*.apiKey",
  "api_key",
  "*.api_key",
  "creditCard",
  "*.creditCard",
  "ssn",
  "*.ssn",
  "headers.authorization",
  "headers.Authorization",
  "req.headers.authorization",
  "req.headers.Authorization",
];

export const logger = pino({
  level:
    process.env.LOG_LEVEL ??
    (isTest ? "silent" : isDevelopment ? "debug" : "info"),
  redact: {
    paths: redactPaths,
    censor: "[REDACTED]",
  },
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
});

// Child logger factory
export const createLogger = (name: string) => logger.child({ name });

// Re-export types
export type { Logger } from "pino";
