import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().trim().min(1, "File ID is required"),
});

export const presignSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1, "File name is required")
    .max(255, "File name must be 255 characters or less"),
  contentType: z.string().trim().min(1, "Content type is required"),
});

export const completeSchema = z.object({
  fileSize: z.number().int().positive().optional(),
});
