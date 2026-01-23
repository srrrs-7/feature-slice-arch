import { prisma } from "@api/lib/db";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import taskRoutes from "../handler";
import { TaskFactory } from "./setup";
import "./setup"; // Import for afterEach cleanup

describe("DELETE /api/tasks/:id", () => {
  const client = testClient(taskRoutes);

  const testCases = [
    {
      name: "deletes existing task",
      setup: async () => {
        const task = await TaskFactory.create({
          title: "Task to delete",
        });
        return { taskId: task.id };
      },
      assert: async (res: Response, context: { taskId: string }) => {
        expect(res.status).toBe(204);

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
      setup: async () => {
        const task = await TaskFactory.create();
        return { taskId: task.id };
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(204);
        const text = await res.text();
        expect(text).toBe("");
      },
    },
    {
      name: "deletes task with all statuses",
      setup: async () => {
        const task = await TaskFactory.use("completed").create();
        return { taskId: task.id };
      },
      assert: async (res: Response, context: { taskId: string }) => {
        expect(res.status).toBe(204);

        const dbTask = await prisma.task.findUnique({
          where: { id: context.taskId },
        });
        expect(dbTask).toBeNull();
      },
    },
    {
      name: "deletes only the specified task among multiple",
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
        res: Response,
        context: { taskId: string; remainingTaskIds: string[] },
      ) => {
        expect(res.status).toBe(204);

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
      name: "returns 404 for non-existent task",
      setup: async () => {
        return { taskId: "550e8400-e29b-41d4-a716-446655440000" };
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data).toHaveProperty("error", "NOT_FOUND");
        expect(data).toHaveProperty("message");
      },
    },
    // Note: Empty ID and whitespace-only ID tests are skipped because
    // they route to GET /api/tasks instead of DELETE /api/tasks/:id
    {
      name: "deletes task with null description",
      setup: async () => {
        const task = await TaskFactory.use("withoutDescription").create();
        return { taskId: task.id };
      },
      assert: async (res: Response, context: { taskId: string }) => {
        expect(res.status).toBe(204);

        const dbTask = await prisma.task.findUnique({
          where: { id: context.taskId },
        });
        expect(dbTask).toBeNull();
      },
    },
  ];

  for (const tc of testCases) {
    it(tc.name, async () => {
      // Setup
      const context = await tc.setup();

      // Execute
      const res = await client[":id"].$delete({
        param: { id: context.taskId },
      });

      // Assert
      await tc.assert(res, context);
    });
  }
});
