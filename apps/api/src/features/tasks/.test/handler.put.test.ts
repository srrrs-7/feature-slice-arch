import { prisma } from "@api/lib/db";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import taskRoutes from "../handler";
import { TaskFactory } from "./setup";
import "./setup"; // Import for afterEach cleanup

describe("PUT /api/tasks/:id", () => {
  const client = testClient(taskRoutes);

  const testCases = [
    {
      name: "updates title only",
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
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.task.title).toBe("Updated Title");
        expect(data.task.description).toBe(context.originalTask.description);
        expect(data.task.status).toBe(context.originalTask.status);
      },
    },
    {
      name: "updates description only",
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
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.task.title).toBe(context.originalTask.title);
        expect(data.task.description).toBe("Updated Description");
        expect(data.task.status).toBe(context.originalTask.status);
      },
    },
    {
      name: "updates status only",
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
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.task.title).toBe(context.originalTask.title);
        expect(data.task.description).toBe(context.originalTask.description);
        expect(data.task.status).toBe("completed");
      },
    },
    {
      name: "updates multiple fields",
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
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.task.title).toBe("Updated Title");
        expect(data.task.description).toBe("Updated Description");
        expect(data.task.status).toBe("in_progress");
      },
    },
    {
      name: "sets description to null",
      setup: async () => {
        const task = await TaskFactory.create({
          title: "Task",
          description: "Original Description",
        });
        return { taskId: task.id };
      },
      input: { description: null },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
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
      setup: async () => {
        const task = await TaskFactory.create({ title: "Original" });
        return { taskId: task.id };
      },
      input: { title: "  Updated Title  " },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.task.title).toBe("Updated Title");
      },
    },
    {
      name: "trims whitespace from description",
      setup: async () => {
        const task = await TaskFactory.create();
        return { taskId: task.id };
      },
      input: { description: "  Updated Description  " },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.task.description).toBe("Updated Description");
      },
    },
    {
      name: "converts empty description to null",
      setup: async () => {
        const task = await TaskFactory.create({
          description: "Original Description",
        });
        return { taskId: task.id };
      },
      input: { description: "   " },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.task.description).toBeNull();
      },
    },
    {
      name: "updates status from pending to in_progress",
      setup: async () => {
        const task = await TaskFactory.create({ status: "pending" });
        return { taskId: task.id };
      },
      input: { status: "in_progress" },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.task.status).toBe("in_progress");
      },
    },
    {
      name: "updates status from in_progress to completed",
      setup: async () => {
        const task = await TaskFactory.use("inProgress").create();
        return { taskId: task.id };
      },
      input: { status: "completed" },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.task.status).toBe("completed");
      },
    },
    {
      name: "returns 404 for non-existent task",
      setup: async () => {
        return { taskId: "550e8400-e29b-41d4-a716-446655440000" };
      },
      input: { title: "Updated Title" },
      assert: async (res: Response) => {
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data).toHaveProperty("error", "NOT_FOUND");
      },
    },
    // Note: Empty ID test is skipped because it routes to a different endpoint
    {
      name: "returns 400 for empty title",
      setup: async () => {
        const task = await TaskFactory.create();
        return { taskId: task.id };
      },
      input: { title: "" },
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "returns 400 for whitespace-only title",
      setup: async () => {
        const task = await TaskFactory.create();
        return { taskId: task.id };
      },
      input: { title: "   " },
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "returns 400 for title too long",
      setup: async () => {
        const task = await TaskFactory.create();
        return { taskId: task.id };
      },
      input: { title: "a".repeat(201) },
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
        expect(data.message).toContain("200 characters");
      },
    },
    {
      name: "returns 400 for description too long",
      setup: async () => {
        const task = await TaskFactory.create();
        return { taskId: task.id };
      },
      input: { description: "a".repeat(1001) },
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
        expect(data.message).toContain("1000 characters");
      },
    },
    {
      name: "returns 400 for invalid status",
      setup: async () => {
        const task = await TaskFactory.create();
        return { taskId: task.id };
      },
      input: { status: "invalid_status" },
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "does not modify createdAt timestamp",
      setup: async () => {
        const task = await TaskFactory.create({ title: "Original" });
        return { taskId: task.id, originalCreatedAt: task.createdAt };
      },
      input: { title: "Updated" },
      assert: async (res: Response, context: { originalCreatedAt: Date }) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(new Date(data.task.createdAt).getTime()).toBe(
          new Date(context.originalCreatedAt).getTime(),
        );
      },
    },
    {
      name: "updates updatedAt timestamp",
      setup: async () => {
        const task = await TaskFactory.create({ title: "Original" });
        // Wait a bit to ensure timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { taskId: task.id, originalUpdatedAt: task.updatedAt };
      },
      input: { title: "Updated" },
      assert: async (res: Response, context: { originalUpdatedAt: Date }) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(new Date(data.task.updatedAt).getTime()).toBeGreaterThan(
          new Date(context.originalUpdatedAt).getTime(),
        );
      },
    },
  ];

  for (const tc of testCases) {
    it(tc.name, async () => {
      // Setup
      const context = await tc.setup();

      // Execute
      const res = await client[":id"].$put({
        param: { id: context.taskId },
        json: tc.input,
      });

      // Assert
      await tc.assert(res, context);
    });
  }
});
