// Public API exports

// Re-export attendance domain types
export type {
  AttendanceError,
  AttendanceId,
  AttendanceRecord,
  AttendanceSummary,
} from "./domain/attendance.ts";
// Re-export stamp domain types
export type {
  CurrentStatusResponse,
  Stamp,
  StampError,
  StampId,
  StampType,
  WorkStatus,
} from "./domain/stamp.ts";

// Export route handlers
export { attendanceRoutes, stampRoutes } from "./handler/index.ts";
