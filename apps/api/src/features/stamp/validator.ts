import { z } from "zod";

// Stamp action type enum
export const stampActionSchema = z.object({
  action: z.enum(["clock_in", "clock_out", "break_start", "break_end"], {
    message:
      "Action must be one of: clock_in, clock_out, break_start, break_end",
  }),
});

// Date param schema (for future use if we need to get stamps by date)
export const dateParamSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});
