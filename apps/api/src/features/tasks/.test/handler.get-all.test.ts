import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import taskRoutes from "../handler";
import { TaskFactory } from "./setup";
import "./setup"; // Import for afterEach cleanup

describe.sequential("GET /api/tasks", () => {
  const client = testClient(taskRoutes);

  const testCases = [
    {
      name: "returns empty array when no tasks exist",
      expectedStatus: 200,
      setup: async () => {
        // No setup needed
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data).toEqual({ tasks: [] });
      },
    },
    {
      name: "returns all tasks",
      expectedStatus: 200,
      setup: async () => {
        await TaskFactory.createList(3);
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.tasks).toHaveLength(3);
      },
    },
    {
      name: "returns tasks with correct structure",
      expectedStatus: 200,
      setup: async () => {
        return await TaskFactory.create({
          title: "Test Task",
          description: "Test Description",
          status: "pending",
        });
      },
      assert: async (res: Response, context?: { id: string }) => {
        const data = await res.json();
        expect(data.tasks).toHaveLength(1);

        const returnedTask = data.tasks[0];
        expect(returnedTask).toMatchObject({
          id: context?.id,
          title: "Test Task",
          description: "Test Description",
          status: "pending",
        });
        expect(returnedTask).toHaveProperty("createdAt");
        expect(returnedTask).toHaveProperty("updatedAt");
      },
    },
    {
      name: "returns tasks with null description",
      expectedStatus: 200,
      setup: async () => {
        await TaskFactory.use("withoutDescription").create({
          title: "Task without description",
        });
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.tasks).toHaveLength(1);
        expect(data.tasks[0].description).toBeNull();
      },
    },
    {
      name: "returns tasks with different statuses",
      expectedStatus: 200,
      setup: async () => {
        await TaskFactory.create({ status: "pending" });
        await TaskFactory.use("inProgress").create();
        await TaskFactory.use("completed").create();
      },
      assert: async (res: Response) => {
        const data = await res.json();
        expect(data.tasks).toHaveLength(3);
        expect(data.tasks.map((t: { status: string }) => t.status)).toEqual(
          expect.arrayContaining(["pending", "in_progress", "completed"]),
        );
      },
    },
  ] as const;

  describe("HTTP 200", () => {
    for (const tc of testCases) {
      it(tc.name, async () => {
        const context = await tc.setup();
        const res = await client.$get();
        expect(res.status).toBe(200);
        await tc.assert(res, context);
      });
    }
  });
});
