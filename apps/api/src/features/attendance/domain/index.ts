// Re-export stamp domain types
export type {
  AlreadyClockedInError,
  AlreadyClockedOutError,
  AlreadyOnBreakError,
  CurrentStatusResponse,
  NotClockedInError,
  NotOnBreakError,
  Stamp,
  StampError,
  StampId,
  StampNotFoundError,
  StampType,
  StillOnBreakError,
  WorkStatus,
} from "./stamp.ts";

export {
  createStamp,
  createStampId,
  getWorkStatus,
  StampErrors,
} from "./stamp.ts";

// Re-export attendance domain types
export type {
  AttendanceError,
  AttendanceId,
  AttendanceNotFoundError,
  AttendanceRecord,
  AttendanceSummary,
  InvalidDateRangeError,
} from "./attendance.ts";

export {
  AttendanceErrors,
  calculateAttendanceFromStamp,
  calculateAttendanceSummary,
  calculateBreakMinutes,
  calculateLateNightMinutes,
  calculateOvertimeMinutes,
  calculateWorkMinutes,
  createAttendanceId,
  createAttendanceRecord,
  LATE_NIGHT_END_HOUR,
  LATE_NIGHT_START_HOUR,
  STANDARD_WORK_MINUTES,
  WEEKLY_STATUTORY_LIMIT_MINUTES,
} from "./attendance.ts";
