import dayjs from "dayjs";
import { testClient } from "hono/testing";
import { describe, expect, it, vi } from "vitest";
import { fileRoutes } from "../handler/index.ts";
import "./setup.ts";
import { FileFactory } from "./setup.ts";

vi.mock("@api/lib/s3/presign", () => ({
  generatePresignedDownloadUrl: vi.fn().mockResolvedValue({
    url: "https://localhost:4566/file-uploads-dev/uploads/test-id/test-file.png?X-Amz-Algorithm=AWS4&X-Amz-Signature=test",
    expiresAt: dayjs().add(1, "hour").toDate(),
    expiresIn: 3600,
  }),
}));

describe.sequential("GET /api/files/:id/view-url", () => {
  const client = testClient(fileRoutes);

  const testCases = [
    {
      name: "returns view URL for uploaded image file",
      expectedStatus: 200,
      setup: async () => {
        const file = await FileFactory.create({
          fileName: "test-image.png",
          contentType: "image/png",
          status: "uploaded",
          fileSize: 1024,
        });
        return { fileId: file.id, contentType: "image/png" };
      },
      assert: async (res: Response, ctx: { contentType: string }) => {
        const data = await res.json();
        expect(data).toHaveProperty("viewUrl");
        expect(data.viewUrl).toContain("X-Amz-");
        expect(data).toHaveProperty("expiresIn", 3600);
        expect(data).toHaveProperty("contentType", ctx.contentType);
      },
    },
    {
      name: "returns view URL for JPEG image",
      expectedStatus: 200,
      setup: async () => {
        const file = await FileFactory.create({
          fileName: "photo.jpg",
          contentType: "image/jpeg",
          status: "uploaded",
          fileSize: 2048,
        });
        return { fileId: file.id, contentType: "image/jpeg" };
      },
      assert: async (res: Response, ctx: { contentType: string }) => {
        const data = await res.json();
        expect(data).toHaveProperty("viewUrl");
        expect(data.viewUrl).toMatch(/^https?:\/\//);
        expect(data).toHaveProperty("contentType", ctx.contentType);
      },
    },
    {
      name: "returns view URL for PDF file",
      expectedStatus: 200,
      setup: async () => {
        const file = await FileFactory.create({
          fileName: "document.pdf",
          contentType: "application/pdf",
          status: "uploaded",
          fileSize: 4096,
        });
        return { fileId: file.id, contentType: "application/pdf" };
      },
      assert: async (res: Response, ctx: { contentType: string }) => {
        const data = await res.json();
        expect(data).toHaveProperty("viewUrl");
        expect(data).toHaveProperty("contentType", ctx.contentType);
      },
    },
    {
      name: "returns view URL for text file",
      expectedStatus: 200,
      setup: async () => {
        const file = await FileFactory.create({
          fileName: "readme.txt",
          contentType: "text/plain",
          status: "uploaded",
          fileSize: 256,
        });
        return { fileId: file.id, contentType: "text/plain" };
      },
      assert: async (res: Response, ctx: { contentType: string }) => {
        const data = await res.json();
        expect(data).toHaveProperty("viewUrl");
        expect(data).toHaveProperty("contentType", ctx.contentType);
      },
    },
    {
      name: "returns view URL for CSV file",
      expectedStatus: 200,
      setup: async () => {
        const file = await FileFactory.create({
          fileName: "data.csv",
          contentType: "text/csv",
          status: "uploaded",
          fileSize: 512,
        });
        return { fileId: file.id, contentType: "text/csv" };
      },
      assert: async (res: Response, ctx: { contentType: string }) => {
        const data = await res.json();
        expect(data).toHaveProperty("viewUrl");
        expect(data).toHaveProperty("contentType", ctx.contentType);
      },
    },
    {
      name: "returns 404 for non-existent file",
      expectedStatus: 404,
      setup: async () => {
        return {
          fileId: "00000000-0000-0000-0000-000000000000",
          contentType: "",
        };
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "NOT_FOUND");
        expect(data.message).toContain("not found");
      },
    },
    {
      name: "returns 404 for pending file",
      expectedStatus: 404,
      setup: async () => {
        const file = await FileFactory.create({
          fileName: "pending-image.png",
          contentType: "image/png",
          status: "pending",
        });
        return { fileId: file.id, contentType: "" };
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "NOT_FOUND");
      },
    },
    {
      name: "returns 404 for failed file",
      expectedStatus: 404,
      setup: async () => {
        const file = await FileFactory.create({
          fileName: "failed-image.png",
          contentType: "image/png",
          status: "failed",
        });
        return { fileId: file.id, contentType: "" };
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "NOT_FOUND");
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
          const res = await client[":id"]["view-url"].$get({
            param: { id: ctx.fileId },
          });
          expect(res.status).toBe(status);
          await tc.assert(res, ctx);
        });
      }
    });
  }
});
