import { prisma } from "@api/lib/db";
import { testClient } from "hono/testing";
import { describe, expect, it } from "vitest";
import taskRoutes from "../handler";
import "./setup"; // Import for afterEach cleanup

describe.sequential("POST /api/tasks", () => {
  const client = testClient(taskRoutes);

  const testCases = [
    {
      name: "creates task with valid data",
      input: {
        title: "New Task",
        description: "Task description",
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(201);
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
      input: {
        title: "Task without description",
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(201);
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
      input: {
        title: "  Title with spaces  ",
        description: "Description",
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.task.title).toBe("Title with spaces");
      },
    },
    {
      name: "trims whitespace from description",
      input: {
        title: "Task",
        description: "  Description with spaces  ",
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.task.description).toBe("Description with spaces");
      },
    },
    {
      name: "converts empty description to null",
      input: {
        title: "Task",
        description: "   ",
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.task.description).toBeNull();
      },
    },
    {
      name: "sets default status to pending",
      input: {
        title: "New Task",
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.task.status).toBe("pending");
      },
    },
    {
      name: "returns 400 for missing title",
      input: {},
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "returns 400 for empty title",
      input: {
        title: "",
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "returns 400 for whitespace-only title",
      input: {
        title: "   ",
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
      },
    },
    {
      name: "returns 400 for title too long",
      input: {
        title: "a".repeat(201),
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
        expect(data.message).toContain("200");
      },
    },
    {
      name: "returns 400 for description too long",
      input: {
        title: "Valid Title",
        description: "a".repeat(1001),
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data).toHaveProperty("error", "BAD_REQUEST");
        expect(data.message).toContain("1000");
      },
    },
    {
      name: "accepts title at max length",
      input: {
        title: "a".repeat(200),
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.task.title).toHaveLength(200);
      },
    },
    {
      name: "accepts description at max length",
      input: {
        title: "Task",
        description: "a".repeat(1000),
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.task.description).toHaveLength(1000);
      },
    },
  ];

  for (const tc of testCases) {
    it(tc.name, async () => {
      // Execute
      const res = await client.$post({ json: tc.input });

      // Assert
      await tc.assert(res);
    });
  }
});
