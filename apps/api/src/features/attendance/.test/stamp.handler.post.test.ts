import { prisma } from "@api/lib/db";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import stampRoutes from "../handler/stamp-handler";
import { getTodayDateString } from "./setup";
import "./setup"; // Import for afterEach cleanup

describe.sequential("POST /api/stamps", () => {
  const client = testClient(stampRoutes);

  describe("clock_in action", () => {
    const testCases = [
      {
        name: "creates stamp with clock-in time",
        setup: async () => {
          // No setup needed - no existing stamp
        },
        input: { action: "clock_in" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(200);
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
        input: { action: "clock_in" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Already clocked in");
        },
      },
    ];

    for (const tc of testCases) {
      it(tc.name, async () => {
        await tc.setup();
        const res = await client.index.$post({ json: tc.input });
        await tc.assert(res);
      });
    }
  });

  describe("clock_out action", () => {
    const testCases = [
      {
        name: "updates stamp with clock-out time",
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
        input: { action: "clock_out" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(200);
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
        setup: async () => {
          const today = getTodayDateString();
          const now = new Date();
          await prisma.stamp.create({
            data: {
              date: today,
              clockInAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
              clockOutAt: null,
              breakStartAt: new Date(now.getTime() - 60 * 60 * 1000),
              breakEndAt: new Date(now.getTime() - 30 * 60 * 1000),
            },
          });
        },
        input: { action: "clock_out" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(200);
          const data = await res.json();
          expect(data.stamp.clockOutAt).not.toBeNull();
          expect(data.stamp.breakStartAt).not.toBeNull();
          expect(data.stamp.breakEndAt).not.toBeNull();
        },
      },
      {
        name: "returns 400 when not clocked in",
        setup: async () => {
          // No stamp exists
        },
        input: { action: "clock_out" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Not clocked in");
        },
      },
      {
        name: "returns 400 when already clocked out",
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
        input: { action: "clock_out" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Already clocked out");
        },
      },
      {
        name: "returns 400 when still on break",
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
        input: { action: "clock_out" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Still on break");
        },
      },
    ];

    for (const tc of testCases) {
      it(tc.name, async () => {
        await tc.setup();
        const res = await client.index.$post({ json: tc.input });
        await tc.assert(res);
      });
    }
  });

  describe("break_start action", () => {
    const testCases = [
      {
        name: "updates stamp with break-start time",
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
        input: { action: "break_start" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(200);
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
        setup: async () => {
          // No stamp exists
        },
        input: { action: "break_start" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Not clocked in");
        },
      },
      {
        name: "returns 400 when already clocked out",
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
        input: { action: "break_start" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Already clocked out");
        },
      },
      {
        name: "returns 400 when already on break",
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
        input: { action: "break_start" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Already on break");
        },
      },
    ];

    for (const tc of testCases) {
      it(tc.name, async () => {
        await tc.setup();
        const res = await client.index.$post({ json: tc.input });
        await tc.assert(res);
      });
    }
  });

  describe("break_end action", () => {
    const testCases = [
      {
        name: "updates stamp with break-end time",
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
        input: { action: "break_end" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(200);
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
        setup: async () => {
          // No stamp exists
        },
        input: { action: "break_end" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Not clocked in");
        },
      },
      {
        name: "returns 400 when not on break (no break started)",
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
        input: { action: "break_end" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Not on break");
        },
      },
      {
        name: "returns 400 when break already ended",
        setup: async () => {
          const today = getTodayDateString();
          const now = new Date();
          await prisma.stamp.create({
            data: {
              date: today,
              clockInAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
              clockOutAt: null,
              breakStartAt: new Date(now.getTime() - 60 * 60 * 1000),
              breakEndAt: new Date(now.getTime() - 30 * 60 * 1000),
            },
          });
        },
        input: { action: "break_end" as const },
        assert: async (res: Response) => {
          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
          expect(data.message).toContain("Not on break");
        },
      },
    ];

    for (const tc of testCases) {
      it(tc.name, async () => {
        await tc.setup();
        const res = await client.index.$post({ json: tc.input });
        await tc.assert(res);
      });
    }
  });

  describe("validation", () => {
    const testCases = [
      {
        name: "returns 400 for missing action",
        input: {},
        assert: async (res: Response) => {
          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
        },
      },
      {
        name: "returns 400 for invalid action type",
        input: { action: "invalid_action" },
        assert: async (res: Response) => {
          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data).toHaveProperty("error", "BAD_REQUEST");
        },
      },
    ];

    for (const tc of testCases) {
      it(tc.name, async () => {
        const res = await client.index.$post({ json: tc.input as never });
        await tc.assert(res);
      });
    }
  });
});
