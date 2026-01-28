import { prisma } from "@api/lib/db";
import { dayjs } from "@api/lib/time";
import { testClient } from "hono/testing";
import { describe, expect, it, vi } from "vitest";
import { fileRoutes } from "../handler/index.ts";
import "./setup";

vi.mock("@api/lib/s3/presign", () => ({
  generatePresignedUploadUrl: vi.fn().mockResolvedValue({
    url: "https://localstack:4566/file-uploads-dev/test-key?signed=true",
    expiresAt: dayjs().add(180, "second").toDate(),
    expiresIn: 180,
  }),
  generateS3Key: vi.fn().mockReturnValue("uploads/test-id/test-file.png"),
}));

describe.sequential("POST /api/files/presign", () => {
  const client = testClient(fileRoutes);

  const testCases = [
    {
      name: "creates presigned URL with valid image/png",
      expectedStatus: 201,
      input: {
        fileName: "test-image.png",
        contentType: "image/png",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.file).toMatchObject({
          fileName: "test-image.png",
          contentType: "image/png",
          status: "pending",
        });
        expect(data.file).toHaveProperty("id");
        expect(data.file).toHaveProperty("expiresAt");
        expect(data).toHaveProperty("uploadUrl");
        expect(data).toHaveProperty("expiresIn", 180);

        const dbFile = await prisma.file.findUnique({
          where: { id: data.file.id },
        });
        expect(dbFile).not.toBeNull();
        expect(dbFile?.status).toBe("pending");
      },
    },
    {
      name: "creates presigned URL with image/jpeg",
      expectedStatus: 201,
      input: {
        fileName: "photo.jpg",
        contentType: "image/jpeg",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.file.contentType).toBe("image/jpeg");
      },
    },
    {
      name: "creates presigned URL with application/pdf",
      expectedStatus: 201,
      input: {
        fileName: "document.pdf",
        contentType: "application/pdf",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.file.contentType).toBe("application/pdf");
      },
    },
    {
      name: "creates presigned URL with text/csv",
      expectedStatus: 201,
      input: {
        fileName: "data.csv",
        contentType: "text/csv",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.file.contentType).toBe("text/csv");
      },
    },
    {
      name: "returns 400 for missing fileName",
      expectedStatus: 400,
      input: {
        contentType: "image/png",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "returns 400 for missing contentType",
      expectedStatus: 400,
      input: {
        fileName: "test.png",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "returns 400 for empty fileName",
      expectedStatus: 400,
      input: {
        fileName: "",
        contentType: "image/png",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "returns 400 for invalid contentType",
      expectedStatus: 400,
      input: {
        fileName: "test.exe",
        contentType: "application/x-msdownload",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "returns 400 for unsupported video contentType",
      expectedStatus: 400,
      input: {
        fileName: "video.mp4",
        contentType: "video/mp4",
      },
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
          const res = await client.presign.$post({
            json: tc.input as Record<string, string>,
          });
          expect(res.status).toBe(status);
          await tc.assert(res);
        });
      }
    });
  }
});
