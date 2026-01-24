// Re-export API types
export type {
  AttendanceId,
  AttendanceSummary,
} from "@api/features/attendance/domain/attendance";

import type { AttendanceSummary as APISummary } from "@api/features/attendance/domain/attendance";

/**
 * Client-side AttendanceRecord type with string dates (from JSON serialization)
 * The API returns Date objects, but JSON serialization converts them to strings
 */
export interface AttendanceRecord {
  readonly id: string;
  readonly date: string;
  readonly clockInAt: string;
  readonly clockOutAt: string | null;
  readonly breakStartAt: string | null;
  readonly breakEndAt: string | null;
  readonly breakMinutes: number;
  readonly workMinutes: number;
  readonly overtimeMinutes: number;
  readonly lateNightMinutes: number;
  readonly statutoryOvertimeMinutes: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * API response types
 */
export interface AttendanceListResponse {
  records: AttendanceRecord[];
  summary: APISummary;
}

export interface AttendanceDetailResponse {
  record: AttendanceRecord;
}
