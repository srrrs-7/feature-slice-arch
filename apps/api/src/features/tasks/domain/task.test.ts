import { describe, expect, test } from "vitest";
import { createTask, createTaskId, TaskErrors } from "./task.ts";

describe("createTaskId", () => {
  test("creates a branded TaskId from string", () => {
    const id = createTaskId("test-id-123");
    expect(id).toBe("test-id-123");
  });
});

describe("createTask", () => {
  test("creates an immutable Task object", () => {
    const now = new Date();
    const task = createTask({
      id: createTaskId("task-1"),
      title: "Test Task",
      description: "Test description",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    expect(task.id).toBe("task-1");
    expect(task.title).toBe("Test Task");
    expect(task.description).toBe("Test description");
    expect(task.status).toBe("pending");
    expect(task.createdAt).toBe(now);
    expect(task.updatedAt).toBe(now);
  });

  test("creates a task with null description", () => {
    const now = new Date();
    const task = createTask({
      id: createTaskId("task-2"),
      title: "No Description Task",
      description: null,
      status: "in_progress",
      createdAt: now,
      updatedAt: now,
    });

    expect(task.description).toBeNull();
    expect(task.status).toBe("in_progress");
  });

  test("created task is frozen (immutable)", () => {
    const task = createTask({
      id: createTaskId("task-3"),
      title: "Immutable Task",
      description: null,
      status: "completed",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(Object.isFrozen(task)).toBe(true);
  });
});

describe("TaskErrors", () => {
  test("notFound creates a NOT_FOUND error with taskId", () => {
    const taskId = createTaskId("missing-task");
    const error = TaskErrors.notFound(taskId);

    expect(error.type).toBe("NOT_FOUND");
    expect(error.taskId).toBe("missing-task");
  });

  test("validation creates a VALIDATION_ERROR with message", () => {
    const error = TaskErrors.validation("Title is required");

    expect(error.type).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Title is required");
  });

  test("alreadyExists creates an ALREADY_EXISTS error with taskId", () => {
    const taskId = createTaskId("duplicate-task");
    const error = TaskErrors.alreadyExists(taskId);

    expect(error.type).toBe("ALREADY_EXISTS");
    expect(error.taskId).toBe("duplicate-task");
  });

  test("database creates a DATABASE_ERROR with cause", () => {
    const cause = new Error("Connection failed");
    const error = TaskErrors.database(cause);

    expect(error.type).toBe("DATABASE_ERROR");
    expect(error.cause).toBe(cause);
  });
});
