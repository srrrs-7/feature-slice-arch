import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import { fileRoutes } from "../handler/index.ts";
import { FileFactory } from "./setup.ts";

describe.sequential("GET /api/files/:id", () => {
  const client = testClient(fileRoutes);

  const testCases = [
    {
      name: "returns existing file",
      expectedStatus: 200,
      setup: async () => {
        const file = await FileFactory.create({
          fileName: "test-file.png",
          contentType: "image/png",
        });
        return { fileId: file.id };
      },
      assert: async (res: Response, ctx: { fileId: string }) => {
        const data = await res.json();
        expect(data.file).toMatchObject({
          id: ctx.fileId,
          fileName: "test-file.png",
          contentType: "image/png",
          status: "pending",
        });
        expect(data.file).toHaveProperty("expiresAt");
        expect(data.file).toHaveProperty("createdAt");
        expect(data.file).toHaveProperty("updatedAt");
      },
    },
    {
      name: "returns uploaded file with fileSize",
      expectedStatus: 200,
      setup: async () => {
        const file = await FileFactory.create({
          fileName: "uploaded.pdf",
          contentType: "application/pdf",
          status: "uploaded",
          fileSize: 2048,
        });
        return { fileId: file.id };
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.file).toMatchObject({
          fileName: "uploaded.pdf",
          contentType: "application/pdf",
          status: "uploaded",
          fileSize: 2048,
        });
      },
    },
    {
      name: "returns 404 for non-existent file",
      expectedStatus: 404,
      setup: async () => {
        return { fileId: "00000000-0000-0000-0000-000000000000" };
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "NOT_FOUND");
        expect(data.message).toContain("not found");
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
          const res = await client[":id"].$get({
            param: { id: ctx.fileId },
          });
          expect(res.status).toBe(status);
          await tc.assert(res, ctx);
        });
      }
    });
  }
});
