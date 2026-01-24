import {
  err,
  errAsync,
  ok,
  okAsync,
  type Result,
  type ResultAsync,
} from "neverthrow";
import { z } from "zod";
import type { StampError } from "../../stamp/domain/stamp.ts";
import { stampRepository } from "../../stamp/repository/repository.ts";
import {
  type AttendanceError,
  AttendanceErrors,
  type AttendanceRecord,
  type AttendanceSummary,
  calculateAttendanceFromStamp,
  calculateAttendanceSummary,
} from "../domain/attendance.ts";

// Validation schemas
const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

// Helper functions
const parseWith = <T>(
  schema: z.ZodType<T>,
  data: unknown,
): Result<T, AttendanceError> => {
  const result = schema.safeParse(data);
  if (result.success) return ok(result.data);
  return err(
    AttendanceErrors.validation(
      result.error.issues[0]?.message ?? "Validation failed",
    ),
  );
};

// Map StampError to AttendanceError
const mapStampError = (error: StampError): AttendanceError => {
  switch (error.type) {
    case "DATABASE_ERROR":
      return AttendanceErrors.database(error.cause);
    case "VALIDATION_ERROR":
      return AttendanceErrors.validation(error.message);
    default:
      // For other stamp-specific errors, treat them as database errors
      return AttendanceErrors.database("Failed to fetch stamp data");
  }
};

/**
 * 特定日の出勤簿を取得
 */
const getByDate = (
  date: string,
): ResultAsync<AttendanceRecord, AttendanceError> => {
  const parsedDate = parseWith(dateSchema, date);
  if (parsedDate.isErr()) {
    return errAsync(parsedDate.error);
  }

  const validDate = parsedDate.value;

  return stampRepository
    .findByDate(validDate)
    .mapErr(mapStampError)
    .andThen((stamp) => {
      if (stamp === null) {
        return errAsync(AttendanceErrors.notFound(validDate));
      }
      return okAsync(calculateAttendanceFromStamp(stamp));
    });
};

/**
 * 期間指定で出勤簿一覧を取得
 */
const getByDateRange = (
  from: string,
  to: string,
): ResultAsync<
  {
    readonly records: readonly AttendanceRecord[];
    readonly summary: AttendanceSummary;
  },
  AttendanceError
> => {
  // Validate dates
  const fromResult = parseWith(dateSchema, from);
  if (fromResult.isErr()) {
    return errAsync(fromResult.error);
  }

  const toResult = parseWith(dateSchema, to);
  if (toResult.isErr()) {
    return errAsync(toResult.error);
  }

  const validFrom = fromResult.value;
  const validTo = toResult.value;

  // Validate date range
  if (validFrom > validTo) {
    return errAsync(
      AttendanceErrors.invalidDateRange(
        `From date (${validFrom}) must be before or equal to to date (${validTo})`,
      ),
    );
  }

  return stampRepository
    .findByDateRange(validFrom, validTo)
    .mapErr(mapStampError)
    .map((stamps) => {
      const records = stamps.map(calculateAttendanceFromStamp);
      const summary = calculateAttendanceSummary(records);
      return { records, summary } as const;
    });
};

// Service as a namespace
export const attendanceService = {
  getByDate,
  getByDateRange,
} as const;
