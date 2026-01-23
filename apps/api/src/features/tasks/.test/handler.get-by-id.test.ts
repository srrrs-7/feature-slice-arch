import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import taskRoutes from "../handler";
import { TaskFactory } from "./setup";
import "./setup"; // Import for afterEach cleanup

describe.sequential("GET /api/tasks/:id", () => {
  const client = testClient(taskRoutes);

  const testCases = [
    {
      name: "returns task by valid ID",
      setup: async () => {
        const task = await TaskFactory.create({
          title: "Test Task",
          description: "Test Description",
          status: "pending",
        });
        return { taskId: task.id, expectedTask: task };
      },
      execute: async (context: { taskId: string }) => {
        return await client[":id"].$get({ param: { id: context.taskId } });
      },
      assert: async (
        res: Response,
        context: {
          taskId: string;
          expectedTask: { id: string; title: string; description: string };
        },
      ) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.task).toMatchObject({
          id: context.expectedTask.id,
          title: context.expectedTask.title,
          description: context.expectedTask.description,
          status: "pending",
        });
        expect(data.task).toHaveProperty("createdAt");
        expect(data.task).toHaveProperty("updatedAt");
      },
    },
    {
      name: "returns 404 for non-existent task",
      setup: async () => {
        // Use a valid UUID format that doesn't exist
        return { taskId: "550e8400-e29b-41d4-a716-446655440000" };
      },
      execute: async (context: { taskId: string }) => {
        return await client[":id"].$get({ param: { id: context.taskId } });
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data).toHaveProperty("error", "NOT_FOUND");
        expect(data).toHaveProperty("message");
      },
    },
    {
      name: "returns correct task among multiple tasks",
      setup: async () => {
        await TaskFactory.createList(3);
        const targetTask = await TaskFactory.create({
          title: "Target Task",
          description: "This is the one we want",
        });
        await TaskFactory.createList(2);
        return { taskId: targetTask.id, expectedTask: targetTask };
      },
      execute: async (context: { taskId: string }) => {
        return await client[":id"].$get({ param: { id: context.taskId } });
      },
      assert: async (
        res: Response,
        context: {
          taskId: string;
          expectedTask: { id: string; title: string; description: string };
        },
      ) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.task.id).toBe(context.expectedTask.id);
        expect(data.task.title).toBe("Target Task");
      },
    },
    {
      name: "returns task with null description",
      setup: async () => {
        const task = await TaskFactory.use("withoutDescription").create({
          title: "Task without description",
        });
        return { taskId: task.id };
      },
      execute: async (context: { taskId: string }) => {
        return await client[":id"].$get({ param: { id: context.taskId } });
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.task.description).toBeNull();
      },
    },
  ];

  for (const tc of testCases) {
    it(tc.name, async () => {
      // Setup
      const context = await tc.setup();

      // Execute
      const res = await tc.execute(context);

      // Assert
      await tc.assert(res, context);
    });
  }
});
