import { z } from "zod";

/**
 * 日付パラメータのバリデーション（YYYY-MM-DD形式）
 */
export const dateParamSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

/**
 * 期間指定クエリパラメータのバリデーション
 */
export const dateRangeQuerySchema = z.object({
  from: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "From date must be in YYYY-MM-DD format"),
  to: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "To date must be in YYYY-MM-DD format"),
});
