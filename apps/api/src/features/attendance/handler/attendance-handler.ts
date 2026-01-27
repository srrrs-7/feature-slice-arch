import {
  responseBadRequest,
  responseDBAccessError,
  responseNotFound,
  responseOk,
} from "@api/lib/http";
import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
import { Hono } from "hono";
import type { AttendanceError } from "../domain/attendance.ts";
import { attendanceService } from "../service/service.ts";
import {
  dateParamSchema,
  dateRangeQuerySchema,
} from "../validator/attendance-validator.ts";

// Helper to handle attendance errors
const handleAttendanceError = (error: AttendanceError, c: Context) => {
  switch (error.type) {
    case "ATTENDANCE_NOT_FOUND":
      return responseNotFound(c, {
        message: `No attendance record for ${error.date}`,
      });
    case "INVALID_DATE_RANGE":
      return responseBadRequest(c, error.message);
    case "VALIDATION_ERROR":
      return responseBadRequest(c, error.message);
    case "DATABASE_ERROR":
      return responseDBAccessError(c);
    default:
      return responseDBAccessError(c, { message: "Unexpected error" });
  }
};

export default new Hono()
  // GET /api/attendance - Get attendance records for date range
  .get(
    "/",
    zValidator("query", dateRangeQuerySchema, (result, c) => {
      if (!result.success) {
        const message =
          result.error.issues[0]?.message ?? "Invalid date range parameters";
        return responseBadRequest(c, message);
      }
    }),
    async (c) => {
      const { from, to } = c.req.valid("query");

      return attendanceService.getByDateRange(from, to).match(
        (result) => responseOk(c, result),
        (error) => handleAttendanceError(error, c),
      );
    },
  )

  // GET /api/attendance/:date - Get attendance record for specific date
  .get(
    "/:date",
    zValidator("param", dateParamSchema, (result, c) => {
      if (!result.success) {
        const message =
          result.error.issues[0]?.message ?? "Invalid date format";
        return responseBadRequest(c, message);
      }
    }),
    async (c) => {
      const { date } = c.req.valid("param");

      return attendanceService.getByDate(date).match(
        (record) => responseOk(c, { record }),
        (error) => handleAttendanceError(error, c),
      );
    },
  );
