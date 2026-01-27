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
      expectedStatus: 200,
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
      name: "returns correct task among multiple tasks",
      expectedStatus: 200,
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
        const data = await res.json();
        expect(data.task.id).toBe(context.expectedTask.id);
        expect(data.task.title).toBe("Target Task");
      },
    },
    {
      name: "returns task with null description",
      expectedStatus: 200,
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
        const data = await res.json();
        expect(data.task.description).toBeNull();
      },
    },
    {
      name: "returns 404 for non-existent task",
      expectedStatus: 404,
      setup: async () => {
        // Use a valid UUID format that doesn't exist
        return { taskId: "550e8400-e29b-41d4-a716-446655440000" };
      },
      execute: async (context: { taskId: string }) => {
        return await client[":id"].$get({ param: { id: context.taskId } });
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "NOT_FOUND");
        expect(data).toHaveProperty("message");
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
          const res = await tc.execute(context);
          expect(res.status).toBe(status);
          await tc.assert(res, context);
        });
      }
    });
  }
});
