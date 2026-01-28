import { prisma } from "@api/lib/db";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import taskRoutes from "../handler/index.ts";
import { TaskFactory } from "./setup";
import "./setup"; // Import for afterEach cleanup

describe.sequential("DELETE /api/tasks/:id", () => {
  const client = testClient(taskRoutes);

  const testCases = [
    {
      name: "deletes existing task",
      expectedStatus: 204,
      setup: async () => {
        const task = await TaskFactory.create({
          title: "Task to delete",
        });
        return { taskId: task.id };
      },
      assert: async (res: Response, context: { taskId: string }) => {
        // Verify response body is empty
        const text = await res.text();
        expect(text).toBe("");

        // Verify task is deleted from database
        const dbTask = await prisma.task.findUnique({
          where: { id: context.taskId },
        });
        expect(dbTask).toBeNull();
      },
    },
    {
      name: "returns no content body",
      expectedStatus: 204,
      setup: async () => {
        const task = await TaskFactory.create();
        return { taskId: task.id };
      },
      assert: async (res: Response) => {
        const text = await res.text();
        expect(text).toBe("");
      },
    },
    {
      name: "deletes task with all statuses",
      expectedStatus: 204,
      setup: async () => {
        const task = await TaskFactory.use("completed").create();
        return { taskId: task.id };
      },
      assert: async (_res: Response, context: { taskId: string }) => {
        const dbTask = await prisma.task.findUnique({
          where: { id: context.taskId },
        });
        expect(dbTask).toBeNull();
      },
    },
    {
      name: "deletes only the specified task among multiple",
      expectedStatus: 204,
      setup: async () => {
        const task1 = await TaskFactory.create({ title: "Task 1" });
        const taskToDelete = await TaskFactory.create({ title: "Task 2" });
        const task3 = await TaskFactory.create({ title: "Task 3" });
        return {
          taskId: taskToDelete.id,
          remainingTaskIds: [task1.id, task3.id],
        };
      },
      assert: async (
        _res: Response,
        context: { taskId: string; remainingTaskIds: string[] },
      ) => {
        // Verify deleted task is gone
        const deletedTask = await prisma.task.findUnique({
          where: { id: context.taskId },
        });
        expect(deletedTask).toBeNull();

        // Verify other tasks remain
        const remainingTasks = await prisma.task.findMany({
          where: { id: { in: context.remainingTaskIds } },
        });
        expect(remainingTasks).toHaveLength(2);
      },
    },
    {
      name: "deletes task with null description",
      expectedStatus: 204,
      setup: async () => {
        const task = await TaskFactory.use("withoutDescription").create();
        return { taskId: task.id };
      },
      assert: async (_res: Response, context: { taskId: string }) => {
        const dbTask = await prisma.task.findUnique({
          where: { id: context.taskId },
        });
        expect(dbTask).toBeNull();
      },
    },
    {
      name: "returns 404 for non-existent task",
      expectedStatus: 404,
      setup: async () => {
        return { taskId: "550e8400-e29b-41d4-a716-446655440000" };
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toHaveProperty("error", "NOT_FOUND");
        expect(data).toHaveProperty("message");
      },
    },
    // Note: Empty ID and whitespace-only ID tests are skipped because
    // they route to GET /api/tasks instead of DELETE /api/tasks/:id
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
          const res = await client[":id"].$delete({
            param: { id: context.taskId },
          });
          expect(res.status).toBe(status);
          await tc.assert(res, context);
        });
      }
    });
  }
});
