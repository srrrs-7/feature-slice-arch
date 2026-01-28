import { prisma } from "@api/lib/db";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import taskRoutes from "../handler/index.ts";
import "./setup"; // Import for afterEach cleanup

describe.sequential("POST /api/tasks", () => {
  const client = testClient(taskRoutes);

  const testCases = [
    {
      name: "creates task with valid data",
      expectedStatus: 201,
      input: {
        title: "New Task",
        description: "Task description",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task).toMatchObject({
          title: "New Task",
          description: "Task description",
          status: "pending",
        });
        expect(data.task).toHaveProperty("id");
        expect(data.task).toHaveProperty("createdAt");
        expect(data.task).toHaveProperty("updatedAt");

        // Verify task exists in database
        const dbTask = await prisma.task.findUnique({
          where: { id: data.task.id },
        });
        expect(dbTask).not.toBeNull();
        expect(dbTask?.title).toBe("New Task");
      },
    },
    {
      name: "creates task without description",
      expectedStatus: 201,
      input: {
        title: "Task without description",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task).toMatchObject({
          title: "Task without description",
          description: null,
          status: "pending",
        });
      },
    },
    {
      name: "trims whitespace from title",
      expectedStatus: 201,
      input: {
        title: "  Title with spaces  ",
        description: "Description",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task.title).toBe("Title with spaces");
      },
    },
    {
      name: "trims whitespace from description",
      expectedStatus: 201,
      input: {
        title: "Task",
        description: "  Description with spaces  ",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task.description).toBe("Description with spaces");
      },
    },
    {
      name: "converts empty description to null",
      expectedStatus: 201,
      input: {
        title: "Task",
        description: "   ",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task.description).toBeNull();
      },
    },
    {
      name: "sets default status to pending",
      expectedStatus: 201,
      input: {
        title: "New Task",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task.status).toBe("pending");
      },
    },
    {
      name: "accepts title at max length",
      expectedStatus: 201,
      input: {
        title: "a".repeat(200),
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task.title).toHaveLength(200);
      },
    },
    {
      name: "accepts description at max length",
      expectedStatus: 201,
      input: {
        title: "Task",
        description: "a".repeat(1000),
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task.description).toHaveLength(1000);
      },
    },
    {
      name: "returns 400 for missing title",
      expectedStatus: 400,
      input: {},
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "returns 400 for empty title",
      expectedStatus: 400,
      input: {
        title: "",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "returns 400 for whitespace-only title",
      expectedStatus: 400,
      input: {
        title: "   ",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "returns 400 for title too long",
      expectedStatus: 400,
      input: {
        title: "a".repeat(201),
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
        expect(data.message).toContain("200");
      },
    },
    {
      name: "returns 400 for description too long",
      expectedStatus: 400,
      input: {
        title: "Valid Title",
        description: "a".repeat(1001),
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
        expect(data.message).toContain("1000");
      },
    },
  ] as const;

  const casesByStatus = new Map<number, typeof testCases>();
  for (const tc of testCases) {
    const list = casesByStatus.get(tc.expectedStatus) ?? [];
    casesByStatus.set(tc.expectedStatus, [...list, tc]);
  }

  for (const [status, cases] of casesByStatus) {
    describe(`HTTP ${status}`, () => {
      for (const tc of cases) {
        it(tc.name, async () => {
          const res = await client.$post({ json: tc.input });
          expect(res.status).toBe(status);
          await tc.assert(res);
        });
      }
    });
  }
});
