import { prisma } from "@api/lib/db";
import dayjs from "dayjs";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import stampRoutes from "../handler/stamp-handler";
import { getTodayDateString } from "./setup";

describe.sequential("GET /api/stamps/status", () => {
  const client = testClient(stampRoutes);

  const testCases = [
    {
      name: "returns not_working status when no stamp exists",
      expectedStatus: 200,
      setup: async () => {
        // No setup needed - no stamp for today
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toMatchObject({
          status: "not_working",
          stamp: null,
        });
      },
    },
    {
      name: "returns working status when clocked in",
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
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.status).toBe("working");
        expect(data.stamp).not.toBeNull();
        expect(data.stamp).toHaveProperty("id");
        expect(data.stamp).toHaveProperty("date");
        expect(data.stamp).toHaveProperty("clockInAt");
        expect(data.stamp.clockOutAt).toBeNull();
      },
    },
    {
      name: "returns on_break status when on break",
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
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.status).toBe("on_break");
        expect(data.stamp).not.toBeNull();
        expect(data.stamp.breakStartAt).not.toBeNull();
        expect(data.stamp.breakEndAt).toBeNull();
      },
    },
    {
      name: "returns clocked_out status when clocked out",
      expectedStatus: 200,
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
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.status).toBe("clocked_out");
        expect(data.stamp).not.toBeNull();
        expect(data.stamp.clockOutAt).not.toBeNull();
      },
    },
    {
      name: "returns working status after break ended",
      expectedStatus: 200,
      setup: async () => {
        const today = getTodayDateString();
        const now = dayjs();
        const breakStart = now.subtract(1, "hour").toDate();
        const breakEnd = now.subtract(30, "minute").toDate();
        await prisma.stamp.create({
          data: {
            date: today,
            clockInAt: now.subtract(2, "hour").toDate(),
            clockOutAt: null,
            breakStartAt: breakStart,
            breakEndAt: breakEnd,
          },
        });
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.status).toBe("working");
        expect(data.stamp).not.toBeNull();
        expect(data.stamp.breakStartAt).not.toBeNull();
        expect(data.stamp.breakEndAt).not.toBeNull();
      },
    },
  ] as const;

  describe("HTTP 200", () => {
    for (const tc of testCases) {
      it(tc.name, async () => {
        await tc.setup();
        const res = await client.status.$get();
        expect(res.status).toBe(200);
        await tc.assert(res);
      });
    }
  });
});
