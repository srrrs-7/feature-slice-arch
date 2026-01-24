// Public API exports
export type {
  AttendanceError,
  AttendanceId,
  AttendanceRecord,
  AttendanceSummary,
} from "./domain/attendance.ts";

export { default as attendanceRoutes } from "./handler.ts";
