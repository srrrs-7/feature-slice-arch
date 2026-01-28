import { dayjs } from "@api/lib/time";
import { describe, expect, test } from "vitest";
import {
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
} from "./attendance.ts";
import { createStamp, createStampId, type Stamp } from "./stamp.ts";

// Helper to create dates
const date = (str: string) => dayjs(str).toDate();

// Helper to create a mock stamp
function createMockStamp(overrides: Partial<Stamp> = {}): Stamp {
  const baseDate = dayjs("2025-01-24T00:00:00Z").toDate();
  return createStamp({
    id: createStampId("stamp-1"),
    date: "2025-01-24",
    clockInAt: date("2025-01-24T09:00:00Z"),
    clockOutAt: date("2025-01-24T18:00:00Z"),
    breakStartAt: date("2025-01-24T12:00:00Z"),
    breakEndAt: date("2025-01-24T13:00:00Z"),
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  });
}

describe("calculateBreakMinutes", () => {
  const testCases = [
    {
      name: "calculates 1 hour break correctly",
      breakStartAt: date("2025-01-24T12:00:00Z"),
      breakEndAt: date("2025-01-24T13:00:00Z"),
      expected: 60,
    },
    {
      name: "calculates 30 minute break correctly",
      breakStartAt: date("2025-01-24T12:00:00Z"),
      breakEndAt: date("2025-01-24T12:30:00Z"),
      expected: 30,
    },
    {
      name: "calculates 2 hour break correctly",
      breakStartAt: date("2025-01-24T12:00:00Z"),
      breakEndAt: date("2025-01-24T14:00:00Z"),
      expected: 120,
    },
    {
      name: "returns 0 when breakStartAt is null",
      breakStartAt: null,
      breakEndAt: date("2025-01-24T13:00:00Z"),
      expected: 0,
    },
    {
      name: "returns 0 when breakEndAt is null",
      breakStartAt: date("2025-01-24T12:00:00Z"),
      breakEndAt: null,
      expected: 0,
    },
    {
      name: "returns 0 when both are null",
      breakStartAt: null,
      breakEndAt: null,
      expected: 0,
    },
    {
      name: "returns 0 for zero-length break",
      breakStartAt: date("2025-01-24T12:00:00Z"),
      breakEndAt: date("2025-01-24T12:00:00Z"),
      expected: 0,
    },
    {
      name: "handles break spanning midnight",
      breakStartAt: date("2025-01-24T23:30:00Z"),
      breakEndAt: date("2025-01-25T00:30:00Z"),
      expected: 60,
    },
  ];

  for (const tc of testCases) {
    test(tc.name, () => {
      const result = calculateBreakMinutes(tc.breakStartAt, tc.breakEndAt);
      expect(result).toBe(tc.expected);
    });
  }
});

describe("calculateWorkMinutes", () => {
  const testCases = [
    {
      name: "calculates 8 hours work with 1 hour break",
      clockInAt: date("2025-01-24T09:00:00Z"),
      clockOutAt: date("2025-01-24T18:00:00Z"),
      breakMinutes: 60,
      expected: 480, // 9時間 - 1時間 = 8時間
    },
    {
      name: "calculates 10 hours work with 1 hour break",
      clockInAt: date("2025-01-24T08:00:00Z"),
      clockOutAt: date("2025-01-24T19:00:00Z"),
      breakMinutes: 60,
      expected: 600, // 11時間 - 1時間 = 10時間
    },
    {
      name: "calculates work with no break",
      clockInAt: date("2025-01-24T09:00:00Z"),
      clockOutAt: date("2025-01-24T17:00:00Z"),
      breakMinutes: 0,
      expected: 480, // 8時間
    },
    {
      name: "returns 0 when clockOutAt is null",
      clockInAt: date("2025-01-24T09:00:00Z"),
      clockOutAt: null,
      breakMinutes: 0,
      expected: 0,
    },
    {
      name: "handles overnight shift",
      clockInAt: date("2025-01-24T22:00:00Z"),
      clockOutAt: date("2025-01-25T06:00:00Z"),
      breakMinutes: 60,
      expected: 420, // 8時間 - 1時間 = 7時間
    },
    {
      name: "returns 0 for same clock in/out time",
      clockInAt: date("2025-01-24T09:00:00Z"),
      clockOutAt: date("2025-01-24T09:00:00Z"),
      breakMinutes: 0,
      expected: 0,
    },
    {
      name: "handles short shift (less than break time - edge case)",
      clockInAt: date("2025-01-24T09:00:00Z"),
      clockOutAt: date("2025-01-24T09:30:00Z"),
      breakMinutes: 60,
      expected: 0, // max(0, 30 - 60) = 0
    },
  ];

  for (const tc of testCases) {
    test(tc.name, () => {
      const result = calculateWorkMinutes(
        tc.clockInAt,
        tc.clockOutAt,
        tc.breakMinutes,
      );
      expect(result).toBe(tc.expected);
    });
  }
});

describe("calculateOvertimeMinutes", () => {
  const testCases = [
    {
      name: "returns 0 for exactly 8 hours (boundary)",
      workMinutes: STANDARD_WORK_MINUTES, // 480
      expected: 0,
    },
    {
      name: "returns 0 for less than 8 hours",
      workMinutes: 420, // 7時間
      expected: 0,
    },
    {
      name: "calculates 1 hour overtime",
      workMinutes: 540, // 9時間
      expected: 60,
    },
    {
      name: "calculates 2 hours overtime",
      workMinutes: 600, // 10時間
      expected: 120,
    },
    {
      name: "calculates 4 hours overtime",
      workMinutes: 720, // 12時間
      expected: 240,
    },
    {
      name: "returns 0 for 0 work minutes",
      workMinutes: 0,
      expected: 0,
    },
    {
      name: "handles 1 minute over standard (boundary)",
      workMinutes: STANDARD_WORK_MINUTES + 1,
      expected: 1,
    },
  ];

  for (const tc of testCases) {
    test(tc.name, () => {
      const result = calculateOvertimeMinutes(tc.workMinutes);
      expect(result).toBe(tc.expected);
    });
  }
});

describe("calculateLateNightMinutes", () => {
  const testCases = [
    {
      name: "returns 0 for daytime work (no late night)",
      clockInAt: date("2025-01-24T09:00:00Z"),
      clockOutAt: date("2025-01-24T18:00:00Z"),
      breakStartAt: null,
      breakEndAt: null,
      expected: 0,
    },
    {
      name: "calculates late night from 22:00 to 02:00 (4 hours)",
      clockInAt: date("2025-01-24T20:00:00Z"),
      clockOutAt: date("2025-01-25T02:00:00Z"),
      breakStartAt: null,
      breakEndAt: null,
      expected: 240, // 22:00-02:00 = 4時間
    },
    {
      name: "calculates late night starting exactly at 22:00 (boundary)",
      clockInAt: date("2025-01-24T22:00:00Z"),
      clockOutAt: date("2025-01-24T23:00:00Z"),
      breakStartAt: null,
      breakEndAt: null,
      expected: 60, // 22:00-23:00 = 1時間
    },
    {
      name: "calculates late night ending exactly at 05:00 (boundary)",
      clockInAt: date("2025-01-25T03:00:00Z"),
      clockOutAt: date("2025-01-25T05:00:00Z"),
      breakStartAt: null,
      breakEndAt: null,
      expected: 120, // 03:00-05:00 = 2時間
    },
    {
      name: "excludes break time during late night hours",
      clockInAt: date("2025-01-24T20:00:00Z"),
      clockOutAt: date("2025-01-25T02:00:00Z"),
      breakStartAt: date("2025-01-24T23:00:00Z"),
      breakEndAt: date("2025-01-25T00:00:00Z"), // 1時間休憩
      expected: 180, // 4時間 - 1時間休憩 = 3時間
    },
    {
      name: "returns 0 when clockOutAt is null",
      clockInAt: date("2025-01-24T22:00:00Z"),
      clockOutAt: null,
      breakStartAt: null,
      breakEndAt: null,
      expected: 0,
    },
    {
      name: "handles work from 21:00 to 23:00 (partial late night)",
      clockInAt: date("2025-01-24T21:00:00Z"),
      clockOutAt: date("2025-01-24T23:00:00Z"),
      breakStartAt: null,
      breakEndAt: null,
      expected: 60, // 22:00-23:00のみ
    },
    {
      name: "handles early morning work 04:00 to 06:00 (partial late night)",
      clockInAt: date("2025-01-24T04:00:00Z"),
      clockOutAt: date("2025-01-24T06:00:00Z"),
      breakStartAt: null,
      breakEndAt: null,
      expected: 60, // 04:00-05:00のみ
    },
    {
      name: "handles full overnight shift",
      clockInAt: date("2025-01-24T22:00:00Z"),
      clockOutAt: date("2025-01-25T05:00:00Z"),
      breakStartAt: null,
      breakEndAt: null,
      expected: 420, // 22:00-05:00 = 7時間
    },
    {
      name: "handles break partially in late night hours",
      clockInAt: date("2025-01-24T21:00:00Z"),
      clockOutAt: date("2025-01-24T23:30:00Z"),
      breakStartAt: date("2025-01-24T21:30:00Z"),
      breakEndAt: date("2025-01-24T22:30:00Z"), // 休憩が22:00をまたぐ
      expected: 60, // 22:30-23:30 = 1時間（休憩中の22:00-22:30は除外）
    },
  ];

  for (const tc of testCases) {
    test(tc.name, () => {
      const result = calculateLateNightMinutes(
        tc.clockInAt,
        tc.clockOutAt,
        tc.breakStartAt,
        tc.breakEndAt,
      );
      expect(result).toBe(tc.expected);
    });
  }
});

describe("calculateAttendanceSummary", () => {
  const testCases = [
    {
      name: "calculates summary for empty records",
      records: [],
      expected: {
        totalWorkMinutes: 0,
        totalBreakMinutes: 0,
        totalOvertimeMinutes: 0,
        totalLateNightMinutes: 0,
        totalStatutoryOvertimeMinutes: 0,
        workDays: 0,
      },
    },
    {
      name: "calculates summary for single record",
      records: [
        createAttendanceRecord({
          id: createAttendanceId("1"),
          date: "2025-01-24",
          clockInAt: date("2025-01-24T09:00:00Z"),
          clockOutAt: date("2025-01-24T18:00:00Z"),
          breakStartAt: date("2025-01-24T12:00:00Z"),
          breakEndAt: date("2025-01-24T13:00:00Z"),
          breakMinutes: 60,
          workMinutes: 480,
          overtimeMinutes: 0,
          lateNightMinutes: 0,
          statutoryOvertimeMinutes: 0,
          createdAt: date("2025-01-24T00:00:00Z"),
          updatedAt: date("2025-01-24T00:00:00Z"),
        }),
      ],
      expected: {
        totalWorkMinutes: 480,
        totalBreakMinutes: 60,
        totalOvertimeMinutes: 0,
        totalLateNightMinutes: 0,
        totalStatutoryOvertimeMinutes: 0,
        workDays: 1,
      },
    },
    {
      name: "calculates summary for multiple records",
      records: [
        createAttendanceRecord({
          id: createAttendanceId("1"),
          date: "2025-01-24",
          clockInAt: date("2025-01-24T09:00:00Z"),
          clockOutAt: date("2025-01-24T18:00:00Z"),
          breakStartAt: date("2025-01-24T12:00:00Z"),
          breakEndAt: date("2025-01-24T13:00:00Z"),
          breakMinutes: 60,
          workMinutes: 480,
          overtimeMinutes: 0,
          lateNightMinutes: 0,
          statutoryOvertimeMinutes: 0,
          createdAt: date("2025-01-24T00:00:00Z"),
          updatedAt: date("2025-01-24T00:00:00Z"),
        }),
        createAttendanceRecord({
          id: createAttendanceId("2"),
          date: "2025-01-25",
          clockInAt: date("2025-01-25T08:00:00Z"),
          clockOutAt: date("2025-01-25T20:00:00Z"),
          breakStartAt: date("2025-01-25T12:00:00Z"),
          breakEndAt: date("2025-01-25T13:00:00Z"),
          breakMinutes: 60,
          workMinutes: 660, // 11時間
          overtimeMinutes: 180, // 3時間残業
          lateNightMinutes: 0,
          statutoryOvertimeMinutes: 180,
          createdAt: date("2025-01-25T00:00:00Z"),
          updatedAt: date("2025-01-25T00:00:00Z"),
        }),
      ],
      expected: {
        totalWorkMinutes: 1140, // 480 + 660
        totalBreakMinutes: 120, // 60 + 60
        totalOvertimeMinutes: 180,
        totalLateNightMinutes: 0,
        totalStatutoryOvertimeMinutes: 0, // 週40時間(2400分)未満
        workDays: 2,
      },
    },
    {
      name: "calculates statutory overtime when exceeding 40 hours/week",
      records: Array.from({ length: 5 }, (_, i) =>
        createAttendanceRecord({
          id: createAttendanceId(`${i + 1}`),
          date: `2025-01-${24 + i}`,
          clockInAt: date(`2025-01-${24 + i}T08:00:00Z`),
          clockOutAt: date(`2025-01-${24 + i}T19:00:00Z`),
          breakStartAt: date(`2025-01-${24 + i}T12:00:00Z`),
          breakEndAt: date(`2025-01-${24 + i}T13:00:00Z`),
          breakMinutes: 60,
          workMinutes: 600, // 10時間/日
          overtimeMinutes: 120, // 2時間残業/日
          lateNightMinutes: 0,
          statutoryOvertimeMinutes: 120,
          createdAt: date(`2025-01-${24 + i}T00:00:00Z`),
          updatedAt: date(`2025-01-${24 + i}T00:00:00Z`),
        }),
      ),
      expected: {
        totalWorkMinutes: 3000, // 600 * 5
        totalBreakMinutes: 300, // 60 * 5
        totalOvertimeMinutes: 600, // 120 * 5
        totalLateNightMinutes: 0,
        totalStatutoryOvertimeMinutes: 600, // 3000 - 2400 = 600分
        workDays: 5,
      },
    },
    {
      name: "includes late night minutes in summary",
      records: [
        createAttendanceRecord({
          id: createAttendanceId("1"),
          date: "2025-01-24",
          clockInAt: date("2025-01-24T20:00:00Z"),
          clockOutAt: date("2025-01-25T02:00:00Z"),
          breakStartAt: null,
          breakEndAt: null,
          breakMinutes: 0,
          workMinutes: 360, // 6時間
          overtimeMinutes: 0,
          lateNightMinutes: 240, // 4時間深夜
          statutoryOvertimeMinutes: 0,
          createdAt: date("2025-01-24T00:00:00Z"),
          updatedAt: date("2025-01-24T00:00:00Z"),
        }),
      ],
      expected: {
        totalWorkMinutes: 360,
        totalBreakMinutes: 0,
        totalOvertimeMinutes: 0,
        totalLateNightMinutes: 240,
        totalStatutoryOvertimeMinutes: 0,
        workDays: 1,
      },
    },
  ];

  for (const tc of testCases) {
    test(tc.name, () => {
      const result = calculateAttendanceSummary(tc.records);
      expect(result).toEqual(tc.expected);
    });
  }
});

describe("calculateAttendanceFromStamp", () => {
  const testCases = [
    {
      name: "calculates all fields correctly for standard workday",
      stamp: createMockStamp(),
      assert: (result: ReturnType<typeof calculateAttendanceFromStamp>) => {
        expect(result.date).toBe("2025-01-24");
        expect(result.workMinutes).toBe(480); // 8時間
        expect(result.breakMinutes).toBe(60); // 1時間
        expect(result.overtimeMinutes).toBe(0);
        expect(result.lateNightMinutes).toBe(0);
        expect(result.statutoryOvertimeMinutes).toBe(0);
      },
    },
    {
      name: "calculates overtime for long workday",
      stamp: createMockStamp({
        clockInAt: date("2025-01-24T08:00:00Z"),
        clockOutAt: date("2025-01-24T20:00:00Z"), // 12時間
        breakStartAt: date("2025-01-24T12:00:00Z"),
        breakEndAt: date("2025-01-24T13:00:00Z"),
      }),
      assert: (result: ReturnType<typeof calculateAttendanceFromStamp>) => {
        expect(result.workMinutes).toBe(660); // 11時間
        expect(result.overtimeMinutes).toBe(180); // 3時間残業
      },
    },
    {
      name: "calculates late night for overnight shift",
      stamp: createMockStamp({
        clockInAt: date("2025-01-24T20:00:00Z"),
        clockOutAt: date("2025-01-25T02:00:00Z"),
        breakStartAt: null,
        breakEndAt: null,
      }),
      assert: (result: ReturnType<typeof calculateAttendanceFromStamp>) => {
        expect(result.workMinutes).toBe(360); // 6時間
        expect(result.lateNightMinutes).toBe(240); // 4時間深夜
      },
    },
    {
      name: "handles stamp without clock out",
      stamp: createMockStamp({
        clockOutAt: null,
        breakStartAt: null,
        breakEndAt: null,
      }),
      assert: (result: ReturnType<typeof calculateAttendanceFromStamp>) => {
        expect(result.workMinutes).toBe(0);
        expect(result.breakMinutes).toBe(0);
        expect(result.overtimeMinutes).toBe(0);
        expect(result.lateNightMinutes).toBe(0);
      },
    },
    {
      name: "preserves stamp id as attendance id",
      stamp: createMockStamp({
        id: createStampId("test-stamp-id"),
      }),
      assert: (result: ReturnType<typeof calculateAttendanceFromStamp>) => {
        expect(result.id).toBe("test-stamp-id");
      },
    },
    {
      name: "preserves timestamps from stamp",
      stamp: createMockStamp({
        clockInAt: date("2025-01-24T09:30:00Z"),
        clockOutAt: date("2025-01-24T17:30:00Z"),
      }),
      assert: (result: ReturnType<typeof calculateAttendanceFromStamp>) => {
        expect(result.clockInAt).toEqual(date("2025-01-24T09:30:00Z"));
        expect(result.clockOutAt).toEqual(date("2025-01-24T17:30:00Z"));
      },
    },
  ];

  for (const tc of testCases) {
    test(tc.name, () => {
      const result = calculateAttendanceFromStamp(tc.stamp);
      tc.assert(result);
    });
  }
});

describe("constants", () => {
  test("STANDARD_WORK_MINUTES is 480 (8 hours)", () => {
    expect(STANDARD_WORK_MINUTES).toBe(480);
  });

  test("LATE_NIGHT_START_HOUR is 22", () => {
    expect(LATE_NIGHT_START_HOUR).toBe(22);
  });

  test("LATE_NIGHT_END_HOUR is 5", () => {
    expect(LATE_NIGHT_END_HOUR).toBe(5);
  });
});
