import { okAsync, type ResultAsync } from "neverthrow";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";
import {
  createStamp,
  createStampId,
  type Stamp,
  type StampError,
} from "../../stamp/domain/stamp.ts";
import type { AttendanceRecord } from "../domain/attendance.ts";

// Mock helpers
function createMockStamp(overrides: Partial<Stamp> = {}): Stamp {
  const baseDate = new Date("2025-01-24T00:00:00Z");
  const clockIn = new Date("2025-01-24T09:00:00Z");
  const clockOut = new Date("2025-01-24T18:00:00Z");
  const breakStart = new Date("2025-01-24T12:00:00Z");
  const breakEnd = new Date("2025-01-24T13:00:00Z");

  return createStamp({
    id: createStampId("stamp-1"),
    date: "2025-01-24",
    clockInAt: clockIn,
    clockOutAt: clockOut,
    breakStartAt: breakStart,
    breakEndAt: breakEnd,
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  });
}

// Type-safe mock
type MockFn<T extends (...args: never[]) => unknown> = Mock<T>;

const mockStampRepository: {
  findByDate: MockFn<(date: string) => ResultAsync<Stamp | null, StampError>>;
  findByDateRange: MockFn<
    (from: string, to: string) => ResultAsync<readonly Stamp[], StampError>
  >;
} = {
  findByDate: vi.fn(() => okAsync(createMockStamp())),
  findByDateRange: vi.fn(() =>
    okAsync([createMockStamp()] as readonly Stamp[]),
  ),
};

// Mock the stamp repository
vi.mock("../../stamp/repository/repository.ts", () => ({
  stampRepository: mockStampRepository,
}));

// Import service after mocking
const { attendanceService } = await import("./service.ts");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("attendanceService.getByDate", () => {
  const testCases = [
    {
      name: "returns attendance record for existing stamp",
      setup: () => {
        const stamp = createMockStamp();
        mockStampRepository.findByDate.mockReturnValue(okAsync(stamp));
      },
      input: "2025-01-24",
      assert: async (result: ResultAsync<AttendanceRecord, unknown>) => {
        const r = await result;
        expect(r.isOk()).toBe(true);
        if (r.isOk()) {
          expect(r.value.date).toBe("2025-01-24");
          expect(r.value.workMinutes).toBe(480); // 9時間 - 1時間休憩 = 8時間
          expect(r.value.breakMinutes).toBe(60); // 1時間休憩
          expect(r.value.overtimeMinutes).toBe(0); // ちょうど8時間なので残業なし
        }
      },
    },
    {
      name: "returns NOT_FOUND error when stamp does not exist",
      setup: () => {
        mockStampRepository.findByDate.mockReturnValue(okAsync(null));
      },
      input: "2025-01-24",
      assert: async (result: ResultAsync<AttendanceRecord, unknown>) => {
        const r = await result;
        expect(r.isErr()).toBe(true);
        if (r.isErr()) {
          expect((r.error as { type: string }).type).toBe(
            "ATTENDANCE_NOT_FOUND",
          );
        }
      },
    },
    {
      name: "returns validation error for invalid date format",
      setup: () => {},
      input: "invalid-date",
      assert: async (result: ResultAsync<AttendanceRecord, unknown>) => {
        const r = await result;
        expect(r.isErr()).toBe(true);
        if (r.isErr()) {
          expect((r.error as { type: string }).type).toBe("VALIDATION_ERROR");
        }
      },
    },
    {
      name: "calculates overtime correctly for 10-hour work day",
      setup: () => {
        const stamp = createMockStamp({
          clockInAt: new Date("2025-01-24T08:00:00Z"),
          clockOutAt: new Date("2025-01-24T19:00:00Z"), // 11時間勤務
          breakStartAt: new Date("2025-01-24T12:00:00Z"),
          breakEndAt: new Date("2025-01-24T13:00:00Z"), // 1時間休憩
        });
        mockStampRepository.findByDate.mockReturnValue(okAsync(stamp));
      },
      input: "2025-01-24",
      assert: async (result: ResultAsync<AttendanceRecord, unknown>) => {
        const r = await result;
        expect(r.isOk()).toBe(true);
        if (r.isOk()) {
          expect(r.value.workMinutes).toBe(600); // 11時間 - 1時間 = 10時間 = 600分
          expect(r.value.overtimeMinutes).toBe(120); // 10時間 - 8時間 = 2時間 = 120分
        }
      },
    },
    {
      name: "calculates late night minutes correctly",
      setup: () => {
        const stamp = createMockStamp({
          clockInAt: new Date("2025-01-24T20:00:00Z"), // 20:00開始
          clockOutAt: new Date("2025-01-25T02:00:00Z"), // 翌02:00終了
          breakStartAt: null,
          breakEndAt: null,
        });
        mockStampRepository.findByDate.mockReturnValue(okAsync(stamp));
      },
      input: "2025-01-24",
      assert: async (result: ResultAsync<AttendanceRecord, unknown>) => {
        const r = await result;
        expect(r.isOk()).toBe(true);
        if (r.isOk()) {
          // 22:00-02:00 = 4時間の深夜残業
          expect(r.value.lateNightMinutes).toBe(240);
        }
      },
    },
    {
      name: "returns 0 work minutes when not clocked out",
      setup: () => {
        const stamp = createMockStamp({
          clockOutAt: null,
          breakStartAt: null,
          breakEndAt: null,
        });
        mockStampRepository.findByDate.mockReturnValue(okAsync(stamp));
      },
      input: "2025-01-24",
      assert: async (result: ResultAsync<AttendanceRecord, unknown>) => {
        const r = await result;
        expect(r.isOk()).toBe(true);
        if (r.isOk()) {
          expect(r.value.workMinutes).toBe(0);
          expect(r.value.breakMinutes).toBe(0);
          expect(r.value.overtimeMinutes).toBe(0);
        }
      },
    },
  ];

  for (const tc of testCases) {
    test(tc.name, async () => {
      tc.setup();
      const result = attendanceService.getByDate(tc.input);
      await tc.assert(result);
    });
  }
});

describe("attendanceService.getByDateRange", () => {
  const testCases = [
    {
      name: "returns attendance records for date range",
      setup: () => {
        const stamps = [
          createMockStamp({ date: "2025-01-24" }),
          createMockStamp({
            id: createStampId("stamp-2"),
            date: "2025-01-25",
          }),
        ];
        mockStampRepository.findByDateRange.mockReturnValue(
          okAsync(stamps as readonly Stamp[]),
        );
      },
      input: { from: "2025-01-24", to: "2025-01-25" },
      assert: async (
        result: ResultAsync<
          { records: readonly AttendanceRecord[]; summary: unknown },
          unknown
        >,
      ) => {
        const r = await result;
        expect(r.isOk()).toBe(true);
        if (r.isOk()) {
          expect(r.value.records).toHaveLength(2);
          expect(r.value.summary).toBeDefined();
        }
      },
    },
    {
      name: "returns empty array when no stamps exist",
      setup: () => {
        mockStampRepository.findByDateRange.mockReturnValue(
          okAsync([] as readonly Stamp[]),
        );
      },
      input: { from: "2025-01-24", to: "2025-01-25" },
      assert: async (
        result: ResultAsync<
          { records: readonly AttendanceRecord[]; summary: unknown },
          unknown
        >,
      ) => {
        const r = await result;
        expect(r.isOk()).toBe(true);
        if (r.isOk()) {
          expect(r.value.records).toHaveLength(0);
        }
      },
    },
    {
      name: "returns validation error when from > to",
      setup: () => {},
      input: { from: "2025-01-25", to: "2025-01-24" },
      assert: async (
        result: ResultAsync<
          { records: readonly AttendanceRecord[]; summary: unknown },
          unknown
        >,
      ) => {
        const r = await result;
        expect(r.isErr()).toBe(true);
        if (r.isErr()) {
          expect((r.error as { type: string }).type).toBe("INVALID_DATE_RANGE");
        }
      },
    },
    {
      name: "returns validation error for invalid from date",
      setup: () => {},
      input: { from: "invalid", to: "2025-01-25" },
      assert: async (
        result: ResultAsync<
          { records: readonly AttendanceRecord[]; summary: unknown },
          unknown
        >,
      ) => {
        const r = await result;
        expect(r.isErr()).toBe(true);
        if (r.isErr()) {
          expect((r.error as { type: string }).type).toBe("VALIDATION_ERROR");
        }
      },
    },
    {
      name: "calculates summary correctly",
      setup: () => {
        const stamps = [
          createMockStamp({
            date: "2025-01-24",
            clockInAt: new Date("2025-01-24T09:00:00Z"),
            clockOutAt: new Date("2025-01-24T18:00:00Z"),
            breakStartAt: new Date("2025-01-24T12:00:00Z"),
            breakEndAt: new Date("2025-01-24T13:00:00Z"),
          }),
          createMockStamp({
            id: createStampId("stamp-2"),
            date: "2025-01-25",
            clockInAt: new Date("2025-01-25T09:00:00Z"),
            clockOutAt: new Date("2025-01-25T20:00:00Z"), // 11時間
            breakStartAt: new Date("2025-01-25T12:00:00Z"),
            breakEndAt: new Date("2025-01-25T13:00:00Z"), // 1時間休憩
          }),
        ];
        mockStampRepository.findByDateRange.mockReturnValue(
          okAsync(stamps as readonly Stamp[]),
        );
      },
      input: { from: "2025-01-24", to: "2025-01-25" },
      assert: async (
        result: ResultAsync<
          {
            records: readonly AttendanceRecord[];
            summary: {
              totalWorkMinutes: number;
              totalBreakMinutes: number;
              totalOvertimeMinutes: number;
              workDays: number;
            };
          },
          unknown
        >,
      ) => {
        const r = await result;
        expect(r.isOk()).toBe(true);
        if (r.isOk()) {
          // Day 1: 8時間 (480分)
          // Day 2: 10時間 (600分)
          // 合計: 18時間 (1080分)
          expect(r.value.summary.totalWorkMinutes).toBe(1080);
          expect(r.value.summary.totalBreakMinutes).toBe(120); // 2時間
          expect(r.value.summary.workDays).toBe(2);
        }
      },
    },
  ];

  for (const tc of testCases) {
    test(tc.name, async () => {
      tc.setup();
      const result = attendanceService.getByDateRange(
        tc.input.from,
        tc.input.to,
      );
      await tc.assert(result);
    });
  }
});
