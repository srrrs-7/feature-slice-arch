import { z } from "zod";

// This feature doesn't require body validation since all endpoints
// use the current date automatically.
// Keeping this file for consistency with the Feature-Sliced Architecture pattern.

// Date param schema (for future use if we need to get stamps by date)
export const dateParamSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});
