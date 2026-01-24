import {
  type DatabaseError,
  Errors,
  type ValidationError,
} from "@api/lib/error";
import type { Stamp } from "../../stamp/domain/stamp.ts";

// Attendance record entity types (immutable)

export type AttendanceId = string & { readonly _brand: unique symbol };

/**
 * 出勤簿レコード
 * stampのデータを元に計算された勤怠情報
 */
export interface AttendanceRecord {
  readonly id: AttendanceId;
  readonly date: string; // YYYY-MM-DD format
  readonly clockInAt: Date;
  readonly clockOutAt: Date | null;
  readonly breakStartAt: Date | null;
  readonly breakEndAt: Date | null;
  // 計算済みフィールド（分単位）
  readonly breakMinutes: number; // 休憩時間
  readonly workMinutes: number; // 実労働時間
  readonly overtimeMinutes: number; // 残業時間（8時間超過分）
  readonly lateNightMinutes: number; // 深夜残業時間（22:00-05:00）
  readonly statutoryOvertimeMinutes: number; // 法定外残業時間
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * 出勤簿一覧のサマリー
 */
export interface AttendanceSummary {
  readonly totalWorkMinutes: number;
  readonly totalBreakMinutes: number;
  readonly totalOvertimeMinutes: number;
  readonly totalLateNightMinutes: number;
  readonly totalStatutoryOvertimeMinutes: number;
  readonly workDays: number;
}

// Domain-specific error types
export type AttendanceNotFoundError = {
  readonly type: "ATTENDANCE_NOT_FOUND";
  readonly date: string;
};

export type InvalidDateRangeError = {
  readonly type: "INVALID_DATE_RANGE";
  readonly message: string;
};

// Combined error type
export type AttendanceError =
  | DatabaseError
  | ValidationError
  | AttendanceNotFoundError
  | InvalidDateRangeError;

// Smart constructors
export const createAttendanceId = (id: string): AttendanceId =>
  id as AttendanceId;

export const createAttendanceRecord = (params: {
  id: AttendanceId;
  date: string;
  clockInAt: Date;
  clockOutAt: Date | null;
  breakStartAt: Date | null;
  breakEndAt: Date | null;
  breakMinutes: number;
  workMinutes: number;
  overtimeMinutes: number;
  lateNightMinutes: number;
  statutoryOvertimeMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}): AttendanceRecord => Object.freeze(params);

// Error constructors
export const AttendanceErrors = {
  notFound: (date: string): AttendanceNotFoundError => ({
    type: "ATTENDANCE_NOT_FOUND",
    date,
  }),
  invalidDateRange: (message: string): InvalidDateRangeError => ({
    type: "INVALID_DATE_RANGE",
    message,
  }),
  validation: Errors.validation,
  database: Errors.database,
} as const;

// Constants for calculation
export const STANDARD_WORK_MINUTES = 480; // 8時間 = 480分
export const LATE_NIGHT_START_HOUR = 22; // 深夜開始 22:00
export const LATE_NIGHT_END_HOUR = 5; // 深夜終了 05:00
export const WEEKLY_STATUTORY_LIMIT_MINUTES = 2400; // 週40時間 = 2400分

/**
 * StampからAttendanceRecordを計算して生成
 */
export const calculateAttendanceFromStamp = (
  stamp: Stamp,
): AttendanceRecord => {
  const breakMinutes = calculateBreakMinutes(
    stamp.breakStartAt,
    stamp.breakEndAt,
  );
  const workMinutes = calculateWorkMinutes(
    stamp.clockInAt,
    stamp.clockOutAt,
    breakMinutes,
  );
  const overtimeMinutes = calculateOvertimeMinutes(workMinutes);
  const lateNightMinutes = calculateLateNightMinutes(
    stamp.clockInAt,
    stamp.clockOutAt,
    stamp.breakStartAt,
    stamp.breakEndAt,
  );
  // 法定外残業は日次では残業時間と同じ（週次計算は別途）
  const statutoryOvertimeMinutes = overtimeMinutes;

  return createAttendanceRecord({
    id: createAttendanceId(stamp.id),
    date: stamp.date,
    clockInAt: stamp.clockInAt,
    clockOutAt: stamp.clockOutAt,
    breakStartAt: stamp.breakStartAt,
    breakEndAt: stamp.breakEndAt,
    breakMinutes,
    workMinutes,
    overtimeMinutes,
    lateNightMinutes,
    statutoryOvertimeMinutes,
    createdAt: stamp.createdAt,
    updatedAt: stamp.updatedAt,
  });
};

/**
 * 休憩時間を計算（分単位）
 */
export const calculateBreakMinutes = (
  breakStartAt: Date | null,
  breakEndAt: Date | null,
): number => {
  if (breakStartAt === null || breakEndAt === null) {
    return 0;
  }
  const diffMs = breakEndAt.getTime() - breakStartAt.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
};

/**
 * 実労働時間を計算（分単位）
 */
export const calculateWorkMinutes = (
  clockInAt: Date,
  clockOutAt: Date | null,
  breakMinutes: number,
): number => {
  if (clockOutAt === null) {
    return 0;
  }
  const diffMs = clockOutAt.getTime() - clockInAt.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  return Math.max(0, totalMinutes - breakMinutes);
};

/**
 * 残業時間を計算（分単位）
 * 8時間（480分）を超えた分
 */
export const calculateOvertimeMinutes = (workMinutes: number): number => {
  return Math.max(0, workMinutes - STANDARD_WORK_MINUTES);
};

/**
 * 深夜残業時間を計算（分単位）
 * 22:00-05:00の間の労働時間
 */
export const calculateLateNightMinutes = (
  clockInAt: Date,
  clockOutAt: Date | null,
  breakStartAt: Date | null,
  breakEndAt: Date | null,
): number => {
  if (clockOutAt === null) {
    return 0;
  }

  let lateNightMinutes = 0;
  const startTime = clockInAt.getTime();
  const endTime = clockOutAt.getTime();

  // 1分ごとにチェック（精度を確保）
  for (let time = startTime; time < endTime; time += 60 * 1000) {
    const date = new Date(time);
    const hour = date.getHours();

    // 深夜時間帯かチェック（22:00-23:59 または 00:00-04:59）
    const isLateNight =
      hour >= LATE_NIGHT_START_HOUR || hour < LATE_NIGHT_END_HOUR;

    if (isLateNight) {
      // 休憩時間中かチェック
      const isOnBreak =
        breakStartAt !== null &&
        breakEndAt !== null &&
        time >= breakStartAt.getTime() &&
        time < breakEndAt.getTime();

      if (!isOnBreak) {
        lateNightMinutes++;
      }
    }
  }

  return lateNightMinutes;
};

/**
 * 出勤簿サマリーを計算
 */
export const calculateAttendanceSummary = (
  records: readonly AttendanceRecord[],
): AttendanceSummary => {
  const summary = records.reduce(
    (acc, record) => ({
      totalWorkMinutes: acc.totalWorkMinutes + record.workMinutes,
      totalBreakMinutes: acc.totalBreakMinutes + record.breakMinutes,
      totalOvertimeMinutes: acc.totalOvertimeMinutes + record.overtimeMinutes,
      totalLateNightMinutes:
        acc.totalLateNightMinutes + record.lateNightMinutes,
      totalStatutoryOvertimeMinutes:
        acc.totalStatutoryOvertimeMinutes + record.statutoryOvertimeMinutes,
      workDays: acc.workDays + 1,
    }),
    {
      totalWorkMinutes: 0,
      totalBreakMinutes: 0,
      totalOvertimeMinutes: 0,
      totalLateNightMinutes: 0,
      totalStatutoryOvertimeMinutes: 0,
      workDays: 0,
    },
  );

  // 週40時間を超えた分を法定外残業として再計算
  const weeklyStatutoryOvertime = Math.max(
    0,
    summary.totalWorkMinutes - WEEKLY_STATUTORY_LIMIT_MINUTES,
  );

  return {
    ...summary,
    totalStatutoryOvertimeMinutes: weeklyStatutoryOvertime,
  };
};
