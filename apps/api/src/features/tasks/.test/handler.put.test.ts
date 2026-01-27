import { prisma } from "@api/lib/db";
import dayjs from "dayjs";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import taskRoutes from "../handler";
import { TaskFactory } from "./setup";
import "./setup"; // Import for afterEach cleanup

describe.sequential("PUT /api/tasks/:id", () => {
  const client = testClient(taskRoutes);

  const testCases = [
    {
      name: "updates title only",
      expectedStatus: 200,
      setup: async () => {
        const task = await TaskFactory.create({
          title: "Original Title",
          description: "Original Description",
          status: "pending",
        });
        return { taskId: task.id, originalTask: task };
      },
      input: { title: "Updated Title" },
      assert: async (
        res: Response,
        context: {
          taskId: string;
          originalTask: { description: string; status: string };
        },
      ) => {
        const data = await res.json();
        expect(data.task.title).toBe("Updated Title");
        expect(data.task.description).toBe(context.originalTask.description);
        expect(data.task.status).toBe(context.originalTask.status);
      },
    },
    {
      name: "updates description only",
      expectedStatus: 200,
      setup: async () => {
        const task = await TaskFactory.create({
          title: "Task Title",
          description: "Original Description",
          status: "pending",
        });
        return { taskId: task.id, originalTask: task };
      },
      input: { description: "Updated Description" },
      assert: async (
        res: Response,
        context: {
          taskId: string;
          originalTask: { title: string; status: string };
        },
      ) => {
        const data = await res.json();
        expect(data.task.title).toBe(context.originalTask.title);
        expect(data.task.description).toBe("Updated Description");
        expect(data.task.status).toBe(context.originalTask.status);
      },
    },
    {
      name: "updates status only",
      expectedStatus: 200,
      setup: async () => {
        const task = await TaskFactory.create({
          title: "Task Title",
          description: "Description",
          status: "pending",
        });
        return { taskId: task.id, originalTask: task };
      },
      input: { status: "completed" },
      assert: async (
        res: Response,
        context: {
          taskId: string;
          originalTask: { title: string; description: string };
        },
      ) => {
        const data = await res.json();
        expect(data.task.title).toBe(context.originalTask.title);
        expect(data.task.description).toBe(context.originalTask.description);
        expect(data.task.status).toBe("completed");
      },
    },
    {
      name: "updates multiple fields",
      expectedStatus: 200,
      setup: async () => {
        const task = await TaskFactory.create({
          title: "Original",
          description: "Original",
          status: "pending",
        });
        return { taskId: task.id };
      },
      input: {
        title: "Updated Title",
        description: "Updated Description",
        status: "in_progress",
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task.title).toBe("Updated Title");
        expect(data.task.description).toBe("Updated Description");
        expect(data.task.status).toBe("in_progress");
      },
    },
    {
      name: "sets description to null",
      expectedStatus: 200,
      setup: async () => {
        const task = await TaskFactory.create({
          title: "Task",
          description: "Original Description",
        });
        return { taskId: task.id };
      },
      input: { description: null },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task.description).toBeNull();

        // Verify in database
        const dbTask = await prisma.task.findUnique({
          where: { id: data.task.id },
        });
        expect(dbTask?.description).toBeNull();
      },
    },
    {
      name: "trims whitespace from title",
      expectedStatus: 200,
      setup: async () => {
        const task = await TaskFactory.create({ title: "Original" });
        return { taskId: task.id };
      },
      input: { title: "  Updated Title  " },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task.title).toBe("Updated Title");
      },
    },
    {
      name: "trims whitespace from description",
      expectedStatus: 200,
      setup: async () => {
        const task = await TaskFactory.create();
        return { taskId: task.id };
      },
      input: { description: "  Updated Description  " },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task.description).toBe("Updated Description");
      },
    },
    {
      name: "converts empty description to null",
      expectedStatus: 200,
      setup: async () => {
        const task = await TaskFactory.create({
          description: "Original Description",
        });
        return { taskId: task.id };
      },
      input: { description: "   " },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task.description).toBeNull();
      },
    },
    {
      name: "updates status from pending to in_progress",
      expectedStatus: 200,
      setup: async () => {
        const task = await TaskFactory.create({ status: "pending" });
        return { taskId: task.id };
      },
      input: { status: "in_progress" },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task.status).toBe("in_progress");
      },
    },
    {
      name: "updates status from in_progress to completed",
      expectedStatus: 200,
      setup: async () => {
        const task = await TaskFactory.use("inProgress").create();
        return { taskId: task.id };
      },
      input: { status: "completed" },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.task.status).toBe("completed");
      },
    },
    {
      name: "does not modify createdAt timestamp",
      expectedStatus: 200,
      setup: async () => {
        const task = await TaskFactory.create({ title: "Original" });
        return { taskId: task.id, originalCreatedAt: task.createdAt };
      },
      input: { title: "Updated" },
      assert: async (res: Response, context: { originalCreatedAt: Date }) => {
        const data = await res.json();
        expect(dayjs(data.task.createdAt).valueOf()).toBe(
          dayjs(context.originalCreatedAt).valueOf(),
        );
      },
    },
    {
      name: "updates updatedAt timestamp",
      expectedStatus: 200,
      setup: async () => {
        const task = await TaskFactory.create({ title: "Original" });
        // Wait a bit to ensure timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { taskId: task.id, originalUpdatedAt: task.updatedAt };
      },
      input: { title: "Updated" },
      assert: async (res: Response, context: { originalUpdatedAt: Date }) => {
        const data = await res.json();
        expect(dayjs(data.task.updatedAt).valueOf()).toBeGreaterThan(
          dayjs(context.originalUpdatedAt).valueOf(),
        );
      },
    },
    {
      name: "returns 404 for non-existent task",
      expectedStatus: 404,
      setup: async () => {
        return { taskId: "550e8400-e29b-41d4-a716-446655440000" };
      },
      input: { title: "Updated Title" },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "NOT_FOUND");
      },
    },
    // Note: Empty ID test is skipped because it routes to a different endpoint
    {
      name: "returns 400 for empty title",
      expectedStatus: 400,
      setup: async () => {
        const task = await TaskFactory.create();
        return { taskId: task.id };
      },
      input: { title: "" },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "returns 400 for whitespace-only title",
      expectedStatus: 400,
      setup: async () => {
        const task = await TaskFactory.create();
        return { taskId: task.id };
      },
      input: { title: "   " },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "returns 400 for title too long",
      expectedStatus: 400,
      setup: async () => {
        const task = await TaskFactory.create();
        return { taskId: task.id };
      },
      input: { title: "a".repeat(201) },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
        expect(data.message).toContain("200 characters");
      },
    },
    {
      name: "returns 400 for description too long",
      expectedStatus: 400,
      setup: async () => {
        const task = await TaskFactory.create();
        return { taskId: task.id };
      },
      input: { description: "a".repeat(1001) },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
        expect(data.message).toContain("1000 characters");
      },
    },
    {
      name: "returns 400 for invalid status",
      expectedStatus: 400,
      setup: async () => {
        const task = await TaskFactory.create();
        return { taskId: task.id };
      },
      input: { status: "invalid_status" },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
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
          const context = await tc.setup();
          const res = await client[":id"].$put({
            param: { id: context.taskId },
            json: tc.input,
          });
          expect(res.status).toBe(status);
          await tc.assert(res, context);
        });
      }
    });
  }
});
