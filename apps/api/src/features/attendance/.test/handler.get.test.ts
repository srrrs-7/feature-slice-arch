import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import attendanceRoutes from "../handler.ts";
import { StampFactory } from "./setup.ts";

describe.sequential("GET /api/attendance", () => {
  const client = testClient(attendanceRoutes);

  const testCases = [
    {
      name: "returns empty records when no stamps exist",
      setup: async () => {
        // No stamps created
      },
      query: { from: "2025-01-01", to: "2025-01-31" },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.records).toHaveLength(0);
        expect(data.summary).toBeDefined();
        expect(data.summary.workDays).toBe(0);
      },
    },
    {
      name: "returns records sorted by date ascending",
      setup: async () => {
        // Create stamps out of order
        await StampFactory.create({
          date: "2025-01-26",
          clockInAt: new Date("2025-01-26T09:00:00Z"),
          clockOutAt: new Date("2025-01-26T18:00:00Z"),
        });
        await StampFactory.create({
          date: "2025-01-24",
          clockInAt: new Date("2025-01-24T09:00:00Z"),
          clockOutAt: new Date("2025-01-24T18:00:00Z"),
        });
        await StampFactory.create({
          date: "2025-01-25",
          clockInAt: new Date("2025-01-25T09:00:00Z"),
          clockOutAt: new Date("2025-01-25T18:00:00Z"),
        });
      },
      query: { from: "2025-01-24", to: "2025-01-26" },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.records).toHaveLength(3);
        // Should be sorted by date ascending
        expect(data.records[0].date).toBe("2025-01-24");
        expect(data.records[1].date).toBe("2025-01-25");
        expect(data.records[2].date).toBe("2025-01-26");
      },
    },
    {
      name: "returns single record when from equals to (same day)",
      setup: async () => {
        await StampFactory.create({
          date: "2025-01-24",
          clockInAt: new Date("2025-01-24T09:00:00Z"),
          clockOutAt: new Date("2025-01-24T18:00:00Z"),
        });
      },
      query: { from: "2025-01-24", to: "2025-01-24" },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.records).toHaveLength(1);
        expect(data.records[0].date).toBe("2025-01-24");
      },
    },
    {
      name: "returns all summary fields with correct structure",
      setup: async () => {
        await StampFactory.create({
          date: "2025-01-24",
          clockInAt: new Date("2025-01-24T09:00:00Z"),
          clockOutAt: new Date("2025-01-24T18:00:00Z"),
          breakStartAt: new Date("2025-01-24T12:00:00Z"),
          breakEndAt: new Date("2025-01-24T13:00:00Z"),
        });
      },
      query: { from: "2025-01-24", to: "2025-01-24" },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.summary).toMatchObject({
          totalWorkMinutes: expect.any(Number),
          totalBreakMinutes: expect.any(Number),
          totalOvertimeMinutes: expect.any(Number),
          totalLateNightMinutes: expect.any(Number),
          totalStatutoryOvertimeMinutes: expect.any(Number),
          workDays: expect.any(Number),
        });
      },
    },
    {
      name: "returns all record fields with correct structure",
      setup: async () => {
        await StampFactory.create({
          date: "2025-01-24",
          clockInAt: new Date("2025-01-24T09:00:00Z"),
          clockOutAt: new Date("2025-01-24T18:00:00Z"),
          breakStartAt: new Date("2025-01-24T12:00:00Z"),
          breakEndAt: new Date("2025-01-24T13:00:00Z"),
        });
      },
      query: { from: "2025-01-24", to: "2025-01-24" },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.records[0]).toMatchObject({
          id: expect.any(String),
          date: "2025-01-24",
          clockInAt: expect.any(String),
          clockOutAt: expect.any(String),
          breakStartAt: expect.any(String),
          breakEndAt: expect.any(String),
          workMinutes: expect.any(Number),
          breakMinutes: expect.any(Number),
          overtimeMinutes: expect.any(Number),
          lateNightMinutes: expect.any(Number),
          statutoryOvertimeMinutes: expect.any(Number),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      },
    },
    {
      name: "returns attendance records for date range",
      setup: async () => {
        await StampFactory.create({
          date: "2025-01-24",
          clockInAt: new Date("2025-01-24T09:00:00Z"),
          clockOutAt: new Date("2025-01-24T18:00:00Z"),
          breakStartAt: new Date("2025-01-24T12:00:00Z"),
          breakEndAt: new Date("2025-01-24T13:00:00Z"),
        });
        await StampFactory.create({
          date: "2025-01-25",
          clockInAt: new Date("2025-01-25T09:00:00Z"),
          clockOutAt: new Date("2025-01-25T18:00:00Z"),
          breakStartAt: new Date("2025-01-25T12:00:00Z"),
          breakEndAt: new Date("2025-01-25T13:00:00Z"),
        });
      },
      query: { from: "2025-01-24", to: "2025-01-25" },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.records).toHaveLength(2);
        expect(data.summary.workDays).toBe(2);
        // 各日8時間 = 960分
        expect(data.summary.totalWorkMinutes).toBe(960);
      },
    },
    {
      name: "calculates overtime correctly",
      setup: async () => {
        await StampFactory.create({
          date: "2025-01-24",
          clockInAt: new Date("2025-01-24T08:00:00Z"),
          clockOutAt: new Date("2025-01-24T20:00:00Z"), // 12時間勤務
          breakStartAt: new Date("2025-01-24T12:00:00Z"),
          breakEndAt: new Date("2025-01-24T13:00:00Z"), // 1時間休憩
        });
      },
      query: { from: "2025-01-24", to: "2025-01-24" },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.records).toHaveLength(1);
        // 12時間 - 1時間休憩 = 11時間 = 660分
        expect(data.records[0].workMinutes).toBe(660);
        // 11時間 - 8時間 = 3時間残業 = 180分
        expect(data.records[0].overtimeMinutes).toBe(180);
      },
    },
    {
      name: "returns validation error for invalid date format",
      setup: async () => {},
      query: { from: "invalid", to: "2025-01-31" },
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("BAD_REQUEST");
      },
    },
    {
      name: "returns validation error when from > to",
      setup: async () => {},
      query: { from: "2025-01-31", to: "2025-01-01" },
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("BAD_REQUEST");
      },
    },
    {
      name: "returns validation error for invalid to date format",
      setup: async () => {},
      query: { from: "2025-01-01", to: "invalid" },
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("BAD_REQUEST");
      },
    },
    {
      name: "filters only stamps within date range",
      setup: async () => {
        // Create stamps outside and inside range
        await StampFactory.create({
          date: "2025-01-23", // Outside range
          clockInAt: new Date("2025-01-23T09:00:00Z"),
          clockOutAt: new Date("2025-01-23T18:00:00Z"),
        });
        await StampFactory.create({
          date: "2025-01-24", // Inside range
          clockInAt: new Date("2025-01-24T09:00:00Z"),
          clockOutAt: new Date("2025-01-24T18:00:00Z"),
        });
        await StampFactory.create({
          date: "2025-01-26", // Outside range
          clockInAt: new Date("2025-01-26T09:00:00Z"),
          clockOutAt: new Date("2025-01-26T18:00:00Z"),
        });
      },
      query: { from: "2025-01-24", to: "2025-01-25" },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.records).toHaveLength(1);
        expect(data.records[0].date).toBe("2025-01-24");
      },
    },
  ];

  for (const tc of testCases) {
    it(tc.name, async () => {
      await tc.setup();
      const res = await client.index.$get({ query: tc.query });
      await tc.assert(res);
    });
  }
});

describe.sequential("GET /api/attendance/:date", () => {
  const client = testClient(attendanceRoutes);

  const testCases = [
    {
      name: "returns attendance record for specific date",
      setup: async () => {
        await StampFactory.create({
          date: "2025-01-24",
          clockInAt: new Date("2025-01-24T09:00:00Z"),
          clockOutAt: new Date("2025-01-24T18:00:00Z"),
          breakStartAt: new Date("2025-01-24T12:00:00Z"),
          breakEndAt: new Date("2025-01-24T13:00:00Z"),
        });
      },
      date: "2025-01-24",
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.record).toBeDefined();
        expect(data.record.date).toBe("2025-01-24");
        expect(data.record.workMinutes).toBe(480); // 8時間
        expect(data.record.breakMinutes).toBe(60); // 1時間
        expect(data.record.overtimeMinutes).toBe(0);
      },
    },
    {
      name: "returns 404 when no stamp exists for date",
      setup: async () => {},
      date: "2025-01-24",
      assert: async (res: Response) => {
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.error).toBe("NOT_FOUND");
      },
    },
    {
      name: "returns validation error for invalid date format",
      setup: async () => {},
      date: "invalid-date",
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("BAD_REQUEST");
      },
    },
    {
      name: "returns record with late night minutes",
      setup: async () => {
        await StampFactory.create({
          date: "2025-01-24",
          clockInAt: new Date("2025-01-24T20:00:00Z"), // 20:00開始
          clockOutAt: new Date("2025-01-25T02:00:00Z"), // 翌02:00終了
          breakStartAt: null,
          breakEndAt: null,
        });
      },
      date: "2025-01-24",
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.record.date).toBe("2025-01-24");
        // 22:00-02:00 = 4時間の深夜残業 = 240分
        expect(data.record.lateNightMinutes).toBe(240);
      },
    },
    {
      name: "returns 0 minutes when not clocked out",
      setup: async () => {
        await StampFactory.create({
          date: "2025-01-24",
          clockInAt: new Date("2025-01-24T09:00:00Z"),
          clockOutAt: null,
          breakStartAt: null,
          breakEndAt: null,
        });
      },
      date: "2025-01-24",
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.record.workMinutes).toBe(0);
        expect(data.record.breakMinutes).toBe(0);
        expect(data.record.overtimeMinutes).toBe(0);
      },
    },
  ];

  for (const tc of testCases) {
    it(tc.name, async () => {
      await tc.setup();
      const res = await client[":date"].$get({ param: { date: tc.date } });
      await tc.assert(res);
    });
  }
});
