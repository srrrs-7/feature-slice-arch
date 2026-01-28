import { dayjs } from "@api/lib/time";
import { errAsync, okAsync, type ResultAsync } from "neverthrow";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";
import {
  createTask,
  createTaskId,
  type Task,
  type TaskError,
  TaskErrors,
  type TaskId,
} from "../domain/task.ts";

function createMockTask(overrides = {}) {
  const now = dayjs();
  return createTask({
    id: createTaskId("task-1"),
    title: "Test Task",
    description: "Test description",
    status: "pending",
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
    ...overrides,
  });
}

// Mock repository with proper types
type MockFn<T extends (...args: never[]) => unknown> = Mock<T>;

const mockRepository: {
  findAll: MockFn<() => ResultAsync<readonly Task[], TaskError>>;
  findById: MockFn<(id: TaskId) => ResultAsync<Task, TaskError>>;
  create: MockFn<
    (params: {
      title: string;
      description: string | null;
    }) => ResultAsync<Task, TaskError>
  >;
  update: MockFn<
    (
      id: TaskId,
      params: { title?: string; description?: string | null; status?: string },
    ) => ResultAsync<Task, TaskError>
  >;
  remove: MockFn<(id: TaskId) => ResultAsync<TaskId, TaskError>>;
} = {
  findAll: vi.fn(() => okAsync([createMockTask()] as readonly Task[])),
  findById: vi.fn(() => okAsync(createMockTask())),
  create: vi.fn(() => okAsync(createMockTask())),
  update: vi.fn(() => okAsync(createMockTask())),
  remove: vi.fn(() => okAsync(createTaskId("task-1") as TaskId)),
};

vi.mock("../repository/repository.ts", () => ({
  taskRepository: mockRepository,
}));

// Import service after mocking
const { taskService } = await import("./service.ts");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("taskService.getAll", () => {
  test("returns all tasks from repository", async () => {
    const tasks = [
      createMockTask(),
      createMockTask({ id: createTaskId("task-2") }),
    ];
    mockRepository.findAll.mockReturnValue(okAsync(Object.freeze(tasks)));

    const result = await taskService.getAll();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(2);
    }
  });

  test("returns error when repository fails", async () => {
    mockRepository.findAll.mockReturnValue(
      errAsync(TaskErrors.database(new Error("DB error"))),
    );

    const result = await taskService.getAll();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("DATABASE_ERROR");
    }
  });
});

describe("taskService.getById", () => {
  test("returns task when found", async () => {
    const task = createMockTask();
    mockRepository.findById.mockReturnValue(okAsync(task));

    const result = await taskService.getById("task-1");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.id).toBe("task-1");
    }
  });

  test("returns validation error for empty id", async () => {
    const result = await taskService.getById("");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
    }
  });

  test("returns validation error for whitespace-only id", async () => {
    const result = await taskService.getById("   ");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
    }
  });

  test("returns not found error when task does not exist", async () => {
    mockRepository.findById.mockReturnValue(
      errAsync(TaskErrors.notFound(createTaskId("missing"))),
    );

    const result = await taskService.getById("missing");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("NOT_FOUND");
    }
  });
});

describe("taskService.create", () => {
  test("creates task with valid input", async () => {
    const task = createMockTask({ title: "New Task" });
    mockRepository.create.mockReturnValue(okAsync(task));

    const result = await taskService.create({
      title: "New Task",
      description: "Description",
    });

    expect(result.isOk()).toBe(true);
    expect(mockRepository.create).toHaveBeenCalledWith({
      title: "New Task",
      description: "Description",
    });
  });

  test("creates task with null description when not provided", async () => {
    const task = createMockTask({ description: null });
    mockRepository.create.mockReturnValue(okAsync(task));

    const result = await taskService.create({ title: "Task" });

    expect(result.isOk()).toBe(true);
    expect(mockRepository.create).toHaveBeenCalledWith({
      title: "Task",
      description: null,
    });
  });

  test("returns validation error for empty title", async () => {
    const result = await taskService.create({ title: "" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
      expect((result.error as { message: string }).message).toBe(
        "Title cannot be empty",
      );
    }
  });

  test("returns validation error for whitespace-only title", async () => {
    const result = await taskService.create({ title: "   " });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
    }
  });

  test("returns validation error for title exceeding 200 characters", async () => {
    const longTitle = "a".repeat(201);
    const result = await taskService.create({ title: longTitle });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
      expect((result.error as { message: string }).message).toBe(
        "Title must be 200 characters or less",
      );
    }
  });

  test("returns validation error for description exceeding 1000 characters", async () => {
    const longDescription = "a".repeat(1001);
    const result = await taskService.create({
      title: "Valid Title",
      description: longDescription,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
      expect((result.error as { message: string }).message).toBe(
        "Description must be 1000 characters or less",
      );
    }
  });

  test("trims title and description", async () => {
    const task = createMockTask();
    mockRepository.create.mockReturnValue(okAsync(task));

    await taskService.create({
      title: "  Trimmed Title  ",
      description: "  Trimmed Description  ",
    });

    expect(mockRepository.create).toHaveBeenCalledWith({
      title: "Trimmed Title",
      description: "Trimmed Description",
    });
  });

  test("converts empty description to null", async () => {
    const task = createMockTask({ description: null });
    mockRepository.create.mockReturnValue(okAsync(task));

    await taskService.create({
      title: "Task",
      description: "   ",
    });

    expect(mockRepository.create).toHaveBeenCalledWith({
      title: "Task",
      description: null,
    });
  });
});

describe("taskService.update", () => {
  test("updates task with valid input", async () => {
    const task = createMockTask({ title: "Updated" });
    mockRepository.update.mockReturnValue(okAsync(task));

    const result = await taskService.update("task-1", { title: "Updated" });

    expect(result.isOk()).toBe(true);
  });

  test("updates task status", async () => {
    const task = createMockTask({ status: "completed" });
    mockRepository.update.mockReturnValue(okAsync(task));

    const result = await taskService.update("task-1", { status: "completed" });

    expect(result.isOk()).toBe(true);
    expect(mockRepository.update).toHaveBeenCalledWith(expect.anything(), {
      status: "completed",
    });
  });

  test("returns validation error for empty id", async () => {
    const result = await taskService.update("", { title: "Updated" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
    }
  });

  test("returns validation error for invalid title in update", async () => {
    const result = await taskService.update("task-1", { title: "" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
    }
  });
});

describe("taskService.delete", () => {
  test("deletes task by id", async () => {
    const taskId = createTaskId("task-1");
    mockRepository.remove.mockReturnValue(okAsync(taskId));

    const result = await taskService.delete("task-1");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe("task-1");
    }
  });

  test("returns validation error for empty id", async () => {
    const result = await taskService.delete("");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
    }
  });

  test("returns not found error when task does not exist", async () => {
    mockRepository.remove.mockReturnValue(
      errAsync(TaskErrors.notFound(createTaskId("missing"))),
    );

    const result = await taskService.delete("missing");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("NOT_FOUND");
    }
  });
});
