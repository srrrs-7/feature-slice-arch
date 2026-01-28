import { dayjs } from "@api/lib/time";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import { fileRoutes } from "../handler/index.ts";
import { FileFactory } from "./setup.ts";

describe.sequential("GET /api/files", () => {
  const client = testClient(fileRoutes);

  const testCases = [
    {
      name: "returns empty array when no files exist",
      expectedStatus: 200,
      setup: async () => {},
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toEqual({ files: [] });
      },
    },
    {
      name: "returns only uploaded files (not pending or failed)",
      expectedStatus: 200,
      setup: async () => {
        await FileFactory.create({
          fileName: "pending.png",
          status: "pending",
        });
        await FileFactory.create({
          fileName: "uploaded.png",
          status: "uploaded",
        });
        await FileFactory.create({
          fileName: "failed.png",
          status: "failed",
        });
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.files).toHaveLength(1);
        expect(data.files[0].fileName).toBe("uploaded.png");
        expect(data.files[0].status).toBe("uploaded");
      },
    },
    {
      name: "returns files ordered by createdAt desc",
      expectedStatus: 200,
      setup: async () => {
        await FileFactory.create({
          fileName: "first.png",
          status: "uploaded",
          createdAt: dayjs("2024-01-01T00:00:00Z").toDate(),
        });
        await FileFactory.create({
          fileName: "second.png",
          status: "uploaded",
          createdAt: dayjs("2024-01-02T00:00:00Z").toDate(),
        });
        await FileFactory.create({
          fileName: "third.png",
          status: "uploaded",
          createdAt: dayjs("2024-01-03T00:00:00Z").toDate(),
        });
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.files).toHaveLength(3);
        expect(data.files[0].fileName).toBe("third.png");
        expect(data.files[1].fileName).toBe("second.png");
        expect(data.files[2].fileName).toBe("first.png");
      },
    },
    {
      name: "returns file with all required fields",
      expectedStatus: 200,
      setup: async () => {
        await FileFactory.create({
          fileName: "complete.pdf",
          contentType: "application/pdf",
          status: "uploaded",
          fileSize: 1024,
        });
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.files).toHaveLength(1);
        const file = data.files[0];
        expect(file).toHaveProperty("id");
        expect(file).toHaveProperty("fileName", "complete.pdf");
        expect(file).toHaveProperty("contentType", "application/pdf");
        expect(file).toHaveProperty("fileSize", 1024);
        expect(file).toHaveProperty("status", "uploaded");
        expect(file).toHaveProperty("expiresAt");
        expect(file).toHaveProperty("createdAt");
        expect(file).toHaveProperty("updatedAt");
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
          await tc.setup();
          const res = await client.$get();
          expect(res.status).toBe(status);
          await tc.assert(res);
        });
      }
    });
  }
});
