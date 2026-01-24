import type { AttendanceSummary } from "@api/features/attendance/domain/attendance";
import type {
  AttendanceDetailResponse,
  AttendanceListResponse,
  AttendanceRecord,
} from "../types";
import { attendanceApi } from "./client";

/**
 * Get attendance records for date range
 * @param from Start date (YYYY-MM-DD)
 * @param to End date (YYYY-MM-DD)
 */
export async function getAttendanceByDateRange(
  from: string,
  to: string,
): Promise<AttendanceListResponse> {
  const res = await attendanceApi.$get({
    query: { from, to },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }));
    const message =
      "message" in data ? (data.message as string) : res.statusText;
    throw new Error(message);
  }
  const data = await res.json();
  return {
    records: data.records as unknown as AttendanceRecord[],
    summary: data.summary as unknown as AttendanceSummary,
  };
}

/**
 * Get attendance record for specific date
 * @param date Date (YYYY-MM-DD)
 */
export async function getAttendanceByDate(
  date: string,
): Promise<AttendanceDetailResponse> {
  const res = await attendanceApi[":date"].$get({
    param: { date },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }));
    const message =
      "message" in data ? (data.message as string) : res.statusText;
    throw new Error(message);
  }
  const data = await res.json();
  return {
    record: data.record as unknown as AttendanceRecord,
  };
}
