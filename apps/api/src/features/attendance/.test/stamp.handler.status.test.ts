import { prisma } from "@api/lib/db";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import stampRoutes from "../handler/stamp-handler";
import { getTodayDateString } from "./setup";

describe.sequential("GET /api/stamps/status", () => {
  const client = testClient(stampRoutes);

  const testCases = [
    {
      name: "returns not_working status when no stamp exists",
      setup: async () => {
        // No setup needed - no stamp for today
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toMatchObject({
          status: "not_working",
          stamp: null,
        });
      },
    },
    {
      name: "returns working status when clocked in",
      setup: async () => {
        const today = getTodayDateString();
        await prisma.stamp.create({
          data: {
            date: today,
            clockInAt: new Date(),
            clockOutAt: null,
            breakStartAt: null,
            breakEndAt: null,
          },
        });
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
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
      setup: async () => {
        const today = getTodayDateString();
        await prisma.stamp.create({
          data: {
            date: today,
            clockInAt: new Date(),
            clockOutAt: null,
            breakStartAt: new Date(),
            breakEndAt: null,
          },
        });
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("on_break");
        expect(data.stamp).not.toBeNull();
        expect(data.stamp.breakStartAt).not.toBeNull();
        expect(data.stamp.breakEndAt).toBeNull();
      },
    },
    {
      name: "returns clocked_out status when clocked out",
      setup: async () => {
        const today = getTodayDateString();
        await prisma.stamp.create({
          data: {
            date: today,
            clockInAt: new Date(),
            clockOutAt: new Date(),
            breakStartAt: null,
            breakEndAt: null,
          },
        });
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("clocked_out");
        expect(data.stamp).not.toBeNull();
        expect(data.stamp.clockOutAt).not.toBeNull();
      },
    },
    {
      name: "returns working status after break ended",
      setup: async () => {
        const today = getTodayDateString();
        const now = new Date();
        const breakStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
        const breakEnd = new Date(now.getTime() - 30 * 60 * 1000); // 30 min ago
        await prisma.stamp.create({
          data: {
            date: today,
            clockInAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
            clockOutAt: null,
            breakStartAt: breakStart,
            breakEndAt: breakEnd,
          },
        });
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.status).toBe("working");
        expect(data.stamp).not.toBeNull();
        expect(data.stamp.breakStartAt).not.toBeNull();
        expect(data.stamp.breakEndAt).not.toBeNull();
      },
    },
  ];

  for (const tc of testCases) {
    it(tc.name, async () => {
      // Setup
      await tc.setup();

      // Execute
      const res = await client.status.$get();

      // Assert
      await tc.assert(res);
    });
  }
});
