import { prisma } from "@api/lib/db";
import dayjs from "dayjs";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import stampRoutes from "../handler/stamp-handler";
import { getTodayDateString } from "./setup";
import "./setup"; // Import for afterEach cleanup

type Case = {
  name: string;
  expectedStatus: number;
  setup?: () => Promise<void>;
  input: unknown;
  assert: (res: Response) => Promise<void>;
};

function groupByStatus<T extends { expectedStatus: number }>(
  cases: readonly T[],
) {
  const casesByStatus = new Map<number, T[]>();
  for (const tc of cases) {
    const list = casesByStatus.get(tc.expectedStatus) ?? [];
    casesByStatus.set(tc.expectedStatus, [...list, tc]);
  }
  return casesByStatus;
}

describe.sequential("POST /api/stamps", () => {
  const client = testClient(stampRoutes);

  const post = (json: unknown) =>
    client.index.$post({ json: json as { action: "clock_in" } });

  describe("clock_in action", () => {
    const testCases = [
      {
        name: "creates stamp with clock-in time",
        expectedStatus: 200,
        setup: async () => {
          // No setup needed - no existing stamp
        },
        input: { action: "clock_in" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data.stamp).toHaveProperty("id");
          expect(data.stamp).toHaveProperty("date");
          expect(data.stamp).toHaveProperty("clockInAt");
          expect(data.stamp.clockOutAt).toBeNull();
          expect(data.stamp.breakStartAt).toBeNull();
          expect(data.stamp.breakEndAt).toBeNull();

          // Verify stamp exists in database
          const dbStamp = await prisma.stamp.findUnique({
            where: { id: data.stamp.id },
          });
          expect(dbStamp).not.toBeNull();
          expect(dbStamp?.clockInAt).not.toBeNull();
        },
      },
      {
        name: "returns 400 when already clocked in today",
        expectedStatus: 400,
        setup: async () => {
          const today = getTodayDateString();
          await prisma.stamp.create({
            data: {
              date: today,
              clockInAt: dayjs().toDate(),
              clockOutAt: null,
              breakStartAt: null,
              breakEndAt: null,
            },
          });
        },
        input: { action: "clock_in" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Already clocked in");
        },
      },
    ] as const satisfies readonly Case[];

    for (const [status, cases] of groupByStatus(testCases)) {
      describe(`HTTP ${status}`, () => {
        for (const tc of cases) {
          it(tc.name, async () => {
            await tc.setup?.();
            const res = await post(tc.input);
            expect(res.status).toBe(status);
            await tc.assert(res);
          });
        }
      });
    }
  });

  describe("clock_out action", () => {
    const testCases = [
      {
        name: "updates stamp with clock-out time",
        expectedStatus: 200,
        setup: async () => {
          const today = getTodayDateString();
          await prisma.stamp.create({
            data: {
              date: today,
              clockInAt: dayjs().toDate(),
              clockOutAt: null,
              breakStartAt: null,
              breakEndAt: null,
            },
          });
        },
        input: { action: "clock_out" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data.stamp).toHaveProperty("id");
          expect(data.stamp.clockOutAt).not.toBeNull();

          // Verify in database
          const dbStamp = await prisma.stamp.findUnique({
            where: { id: data.stamp.id },
          });
          expect(dbStamp?.clockOutAt).not.toBeNull();
        },
      },
      {
        name: "allows clock-out after break ended",
        expectedStatus: 200,
        setup: async () => {
          const today = getTodayDateString();
          const now = dayjs();
          await prisma.stamp.create({
            data: {
              date: today,
              clockInAt: now.subtract(2, "hour").toDate(),
              clockOutAt: null,
              breakStartAt: now.subtract(1, "hour").toDate(),
              breakEndAt: now.subtract(30, "minute").toDate(),
            },
          });
        },
        input: { action: "clock_out" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data.stamp.clockOutAt).not.toBeNull();
          expect(data.stamp.breakStartAt).not.toBeNull();
          expect(data.stamp.breakEndAt).not.toBeNull();
        },
      },
      {
        name: "returns 400 when not clocked in",
        expectedStatus: 400,
        setup: async () => {
          // No stamp exists
        },
        input: { action: "clock_out" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Not clocked in");
        },
      },
      {
        name: "returns 400 when already clocked out",
        expectedStatus: 400,
        setup: async () => {
          const today = getTodayDateString();
          await prisma.stamp.create({
            data: {
              date: today,
              clockInAt: dayjs().toDate(),
              clockOutAt: dayjs().toDate(),
              breakStartAt: null,
              breakEndAt: null,
            },
          });
        },
        input: { action: "clock_out" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Already clocked out");
        },
      },
      {
        name: "returns 400 when still on break",
        expectedStatus: 400,
        setup: async () => {
          const today = getTodayDateString();
          await prisma.stamp.create({
            data: {
              date: today,
              clockInAt: dayjs().toDate(),
              clockOutAt: null,
              breakStartAt: dayjs().toDate(),
              breakEndAt: null,
            },
          });
        },
        input: { action: "clock_out" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Still on break");
        },
      },
    ] as const satisfies readonly Case[];

    for (const [status, cases] of groupByStatus(testCases)) {
      describe(`HTTP ${status}`, () => {
        for (const tc of cases) {
          it(tc.name, async () => {
            await tc.setup?.();
            const res = await post(tc.input);
            expect(res.status).toBe(status);
            await tc.assert(res);
          });
        }
      });
    }
  });

  describe("break_start action", () => {
    const testCases = [
      {
        name: "updates stamp with break-start time",
        expectedStatus: 200,
        setup: async () => {
          const today = getTodayDateString();
          await prisma.stamp.create({
            data: {
              date: today,
              clockInAt: dayjs().toDate(),
              clockOutAt: null,
              breakStartAt: null,
              breakEndAt: null,
            },
          });
        },
        input: { action: "break_start" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data.stamp).toHaveProperty("id");
          expect(data.stamp.breakStartAt).not.toBeNull();
          expect(data.stamp.breakEndAt).toBeNull();

          // Verify in database
          const dbStamp = await prisma.stamp.findUnique({
            where: { id: data.stamp.id },
          });
          expect(dbStamp?.breakStartAt).not.toBeNull();
        },
      },
      {
        name: "returns 400 when not clocked in",
        expectedStatus: 400,
        setup: async () => {
          // No stamp exists
        },
        input: { action: "break_start" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Not clocked in");
        },
      },
      {
        name: "returns 400 when already clocked out",
        expectedStatus: 400,
        setup: async () => {
          const today = getTodayDateString();
          await prisma.stamp.create({
            data: {
              date: today,
              clockInAt: dayjs().toDate(),
              clockOutAt: dayjs().toDate(),
              breakStartAt: null,
              breakEndAt: null,
            },
          });
        },
        input: { action: "break_start" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Already clocked out");
        },
      },
      {
        name: "returns 400 when already on break",
        expectedStatus: 400,
        setup: async () => {
          const today = getTodayDateString();
          await prisma.stamp.create({
            data: {
              date: today,
              clockInAt: dayjs().toDate(),
              clockOutAt: null,
              breakStartAt: dayjs().toDate(),
              breakEndAt: null,
            },
          });
        },
        input: { action: "break_start" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Already on break");
        },
      },
    ] as const satisfies readonly Case[];

    for (const [status, cases] of groupByStatus(testCases)) {
      describe(`HTTP ${status}`, () => {
        for (const tc of cases) {
          it(tc.name, async () => {
            await tc.setup?.();
            const res = await post(tc.input);
            expect(res.status).toBe(status);
            await tc.assert(res);
          });
        }
      });
    }
  });

  describe("break_end action", () => {
    const testCases = [
      {
        name: "updates stamp with break-end time",
        expectedStatus: 200,
        setup: async () => {
          const today = getTodayDateString();
          await prisma.stamp.create({
            data: {
              date: today,
              clockInAt: dayjs().toDate(),
              clockOutAt: null,
              breakStartAt: dayjs().toDate(),
              breakEndAt: null,
            },
          });
        },
        input: { action: "break_end" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data.stamp).toHaveProperty("id");
          expect(data.stamp.breakStartAt).not.toBeNull();
          expect(data.stamp.breakEndAt).not.toBeNull();

          // Verify in database
          const dbStamp = await prisma.stamp.findUnique({
            where: { id: data.stamp.id },
          });
          expect(dbStamp?.breakEndAt).not.toBeNull();
        },
      },
      {
        name: "returns 400 when not clocked in",
        expectedStatus: 400,
        setup: async () => {
          // No stamp exists
        },
        input: { action: "break_end" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Not clocked in");
        },
      },
      {
        name: "returns 400 when not on break (no break started)",
        expectedStatus: 400,
        setup: async () => {
          const today = getTodayDateString();
          await prisma.stamp.create({
            data: {
              date: today,
              clockInAt: dayjs().toDate(),
              clockOutAt: null,
              breakStartAt: null,
              breakEndAt: null,
            },
          });
        },
        input: { action: "break_end" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Not on break");
        },
      },
      {
        name: "returns 400 when break already ended",
        expectedStatus: 400,
        setup: async () => {
          const today = getTodayDateString();
          const now = dayjs();
          await prisma.stamp.create({
            data: {
              date: today,
              clockInAt: now.subtract(2, "hour").toDate(),
              clockOutAt: null,
              breakStartAt: now.subtract(1, "hour").toDate(),
              breakEndAt: now.subtract(30, "minute").toDate(),
            },
          });
        },
        input: { action: "break_end" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Not on break");
        },
      },
    ] as const satisfies readonly Case[];

    for (const [status, cases] of groupByStatus(testCases)) {
      describe(`HTTP ${status}`, () => {
        for (const tc of cases) {
          it(tc.name, async () => {
            await tc.setup?.();
            const res = await post(tc.input);
            expect(res.status).toBe(status);
            await tc.assert(res);
          });
        }
      });
    }
  });

  describe("validation", () => {
    const testCases = [
      {
        name: "returns 400 for missing action",
        expectedStatus: 400,
        input: {},
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
        },
      },
      {
        name: "returns 400 for invalid action type",
        expectedStatus: 400,
        input: { action: "invalid_action" },
        assert: async (res: Response) => {
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
        },
      },
    ] as const satisfies readonly Case[];

    describe("HTTP 400", () => {
      for (const tc of testCases) {
        it(tc.name, async () => {
          const res = await post(tc.input);
          expect(res.status).toBe(400);
          await tc.assert(res);
        });
      }
    });
  });
});
