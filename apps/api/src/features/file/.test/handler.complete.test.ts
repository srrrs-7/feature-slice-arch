import { dayjs } from "@api/lib/time";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import { fileRoutes } from "../handler/index.ts";
import { FileFactory } from "./setup.ts";

describe.sequential("PUT /api/files/:id/complete", () => {
  const client = testClient(fileRoutes);

  const testCases = [
    {
      name: "marks pending file as uploaded",
      expectedStatus: 200,
      setup: async () => {
        const file = await FileFactory.create();
        return { fileId: file.id };
      },
      input: { fileSize: 1024 },
      assert: async (res: Response, ctx: { fileId: string }) => {
        const data = await res.json();
        expect(data.file).toMatchObject({
          id: ctx.fileId,
          status: "uploaded",
          fileSize: 1024,
        });
      },
    },
    {
      name: "marks file as uploaded without fileSize",
      expectedStatus: 200,
      setup: async () => {
        const file = await FileFactory.create();
        return { fileId: file.id };
      },
      input: {},
      assert: async (res: Response, ctx: { fileId: string }) => {
        const data = await res.json();
        expect(data.file).toMatchObject({
          id: ctx.fileId,
          status: "uploaded",
        });
        expect(data.file.fileSize).toBeNull();
      },
    },
    {
      name: "returns 404 for non-existent file",
      expectedStatus: 404,
      setup: async () => {
        return { fileId: "00000000-0000-0000-0000-000000000000" };
      },
      input: {},
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "NOT_FOUND");
      },
    },
    {
      name: "returns 400 for already completed file",
      expectedStatus: 400,
      setup: async () => {
        const file = await FileFactory.create({
          status: "uploaded",
          fileSize: 1024,
        });
        return { fileId: file.id };
      },
      input: {},
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
        expect(data.message).toContain("already completed");
      },
    },
    {
      name: "returns 400 for expired file",
      expectedStatus: 400,
      setup: async () => {
        const file = await FileFactory.create({
          status: "pending",
          expiresAt: dayjs().subtract(1, "second").toDate(),
        });
        return { fileId: file.id };
      },
      input: {},
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
        expect(data.message).toContain("expired");
      },
    },
    {
      name: "returns 400 for failed file",
      expectedStatus: 400,
      setup: async () => {
        const file = await FileFactory.create({
          status: "failed",
        });
        return { fileId: file.id };
      },
      input: {},
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
  ] as const;

  const casesByStatus = new Map<number, (typeof testCases)[number][]>();
  for (const tc of testCases) {
    const list = casesByStatus.get(tc.expectedStatus) ?? [];
    casesByStatus.set(tc.expectedStatus, [...list, tc]);
  }

  for (const [status, cases] of casesByStatus) {
    describe(`HTTP ${status}`, () => {
      for (const tc of cases) {
        it(tc.name, async () => {
          const ctx = await tc.setup();
          const res = await client[":id"].complete.$put({
            param: { id: ctx.fileId },
            json: tc.input,
          });
          expect(res.status).toBe(status);
          await tc.assert(res, ctx);
        });
      }
    });
  }
});
