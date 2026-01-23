import { cors } from "hono/cors";

/**
 * CORS allowed origins configuration.
 * Set CORS_ALLOWED_ORIGINS environment variable as comma-separated list.
 * Example: CORS_ALLOWED_ORIGINS=https://example.com,https://app.example.com
 *
 * Defaults to localhost for development.
 */
const defaultOrigins = ["http://localhost:3000", "http://localhost:5173"];
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : defaultOrigins;

export const corsMiddleware = cors({
  origin: allowedOrigins,
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["Content-Length"],
  maxAge: 86400,
  credentials: true,
});
