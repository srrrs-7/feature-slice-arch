# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

REST API built with Hono and Feature-Sliced Architecture, using Prisma 7 with PostgreSQL.

| Technology | Version |
|------------|---------|
| Runtime | Bun 1.3.5 |
| Framework | Hono 4.11 |
| ORM | Prisma 7 |
| Database | PostgreSQL 17 |
| Validation | Zod 4 |
| Error Handling | neverthrow 8 |
| Testing | Vitest 4 |

## Commands

```bash
# Development
bun run dev              # Start API server with HMR (port 8080)
bun run start            # Start API server (production)

# Testing
bun run test             # Run tests with vitest
bun run test:watch       # Run tests in watch mode
bun run test:coverage    # Run tests with coverage report

# Build & Type Check
bun run build            # Build API
bun run check:type       # Type check with tsgo

# Database (Prisma)
bun run db:generate      # Generate Prisma client
bun run db:migrate:dev   # Run migrations in development
bun run db:migrate:deploy # Deploy migrations (production)
bun run db:migrate:reset # Reset database (drop all data)
bun run db:studio        # Open Prisma Studio
bun run db:seed          # Seed database with initial data
```

## Architecture

Feature-Sliced Architecture with strict layering:

```
src/
├── features/           # Feature modules (domains)
│   └── {feature}/
│       ├── index.ts        # Public API - exports types and routes
│       ├── domain/         # Domain layer
│       │   ├── {name}.ts       # Domain types, entities, errors
│       │   └── index.ts        # Barrel export (optional)
│       ├── service/        # Service layer
│       │   ├── {name}-service.ts   # Business logic
│       │   ├── {name}-service.test.ts
│       │   └── index.ts        # Barrel export
│       ├── repository/     # Repository layer
│       │   └── {name}-repository.ts
│       ├── handler/        # HTTP handlers (for multiple routes)
│       │   ├── {name}-handler.ts
│       │   └── index.ts
│       ├── validator/      # Zod validation schemas
│       │   ├── {name}-validator.ts
│       │   └── index.ts
│       └── .test/          # Handler E2E tests
├── middleware/         # Hono middleware
├── lib/                # Shared workspace (@api/lib)
│   ├── db/             # Database configuration
│   ├── error/          # Common error types
│   ├── http/           # HTTP response helpers
│   ├── logger/         # Pino logger
│   ├── time/           # Time utilities (dayjs)
│   └── types/          # Shared types (Result helpers)
└── index.ts            # Entry point - Hono app setup
```

## Feature Examples

### tasks - Simple feature (single handler)
```
features/tasks/
├── index.ts
├── domain/task.ts
├── service/service.ts
├── repository/repository.ts
├── handler.ts          # Single handler file
├── validator.ts        # Single validator file
└── .test/
```

### attendance - Complex feature (multiple sub-domains)
```
features/attendance/
├── index.ts                    # Public API exports
├── domain/
│   ├── stamp.ts               # Stamp entity (clock in/out, break)
│   ├── attendance.ts          # Attendance calculations
│   └── index.ts               # Barrel export
├── service/
│   ├── stamp-service.ts       # Stamp business logic
│   ├── service.ts             # Attendance calculations
│   └── index.ts               # Exports both services
├── repository/
│   └── stamp-repository.ts    # Database operations
├── handler/
│   ├── stamp-handler.ts       # POST /api/stamps, GET /api/stamps/status
│   ├── attendance-handler.ts  # GET /api/attendance endpoints
│   └── index.ts               # Exports stampRoutes, attendanceRoutes
├── validator/
│   ├── stamp-validator.ts
│   ├── attendance-validator.ts
│   └── index.ts
└── .test/
    ├── setup.ts
    ├── stamp.handler.post.test.ts
    ├── stamp.handler.status.test.ts
    └── handler.get.test.ts
```

## Layer Responsibilities

### Domain Layer (`domain/`)

Define domain entities, types, and business rules.

```typescript
// Branded types for type-safe IDs
export type TaskId = string & { readonly _brand: unique symbol };

// Immutable domain entity
export interface Task {
  readonly id: TaskId;
  readonly title: string;
  readonly status: TaskStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Smart constructors
export const createTaskId = (id: string): TaskId => id as TaskId;
export const createTask = (params: TaskParams): Task => Object.freeze(params);

// Domain-specific errors (discriminated union)
export type TaskError =
  | { readonly type: "NOT_FOUND"; readonly taskId: TaskId }
  | { readonly type: "VALIDATION_ERROR"; readonly message: string }
  | { readonly type: "DATABASE_ERROR"; readonly cause: Error };

// Error factory functions
export const TaskErrors = {
  notFound: (taskId: TaskId) => ({ type: "NOT_FOUND" as const, taskId }),
  validation: (message: string) => ({ type: "VALIDATION_ERROR" as const, message }),
  database: (cause: Error) => ({ type: "DATABASE_ERROR" as const, cause }),
} as const;
```

### Service Layer (`service/`)

Business logic and validation. Returns `ResultAsync<T, Error>`.

```typescript
import { ResultAsync, okAsync, errAsync } from "neverthrow";
import { z } from "zod";

// Zod schema with validation
const taskIdSchema = z.string().trim().min(1, "Task ID is required");

// Parse helper
const parseWith = <T>(schema: z.ZodType<T>, data: unknown): Result<T, TaskError> => {
  const result = schema.safeParse(data);
  return result.success ? ok(result.data) : err(TaskErrors.validation(result.error.issues[0]?.message ?? "Validation failed"));
};

// Lift Result to ResultAsync
const liftAsync = <T, E>(result: Result<T, E>): ResultAsync<T, E> =>
  result.match(okAsync, errAsync);

// Service function - composable with andThen
export const getTaskById = (id: string): ResultAsync<Task, TaskError> =>
  liftAsync(parseWith(taskIdSchema, id))
    .andThen(taskRepository.findById);

// Namespace export
export const taskService = {
  getAll: getAllTasks,
  getById: getTaskById,
  create: createTask,
  update: updateTask,
  delete: deleteTask,
} as const;
```

### Repository Layer (`repository/`)

Data access with Prisma. Returns `ResultAsync<T, Error>`.

```typescript
import { wrapAsyncWithLog } from "@api/lib/types/result/db";
import { isDatabaseNotFound } from "@api/lib/error";

export const findById = (id: TaskId): ResultAsync<Task, TaskError> =>
  wrapAsyncWithLog(
    "taskRepository.findById",
    { id },
    () => prisma.task.findUnique({ where: { id: id as string } }),
    TaskErrors.database
  ).andThen((task) =>
    task ? ok(toDomain(task)) : err(TaskErrors.notFound(id))
  );

// Handle Prisma P2025 (not found) errors
export const update = (id: TaskId, params: UpdateParams): ResultAsync<Task, TaskError> =>
  wrapAsyncWithLog(
    "taskRepository.update",
    { id, ...params },
    () => prisma.task.update({ where: { id: id as string }, data: params }),
    TaskErrors.database
  )
    .map(toDomain)
    .mapErr((error) => isDatabaseNotFound(error) ? TaskErrors.notFound(id) : error);
```

### Handler Layer (`handler.ts`)

HTTP request/response handling with Hono.

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { responseOk, responseNotFound, responseBadRequest, responseDBAccessError } from "@api/lib/http";

export default new Hono()
  .get(
    "/:id",
    zValidator("param", idParamSchema, (result, c) => {
      if (!result.success) return responseBadRequest(c, result.error.issues);
    }),
    async (c) => {
      const { id } = c.req.valid("param");

      return taskService.getById(id).match(
        (task) => responseOk(c, { task }),
        (error) => {
          switch (error.type) {
            case "NOT_FOUND":
              return responseNotFound(c, { message: `Task not found: ${error.taskId}` });
            case "VALIDATION_ERROR":
              return responseBadRequest(c, error.message);
            case "DATABASE_ERROR":
              return responseDBAccessError(c);
          }
        }
      );
    }
  );
```

### Public API (`index.ts`)

Export only types and routes.

```typescript
export type { Task, TaskId, TaskError } from "./domain/task.ts";
export { default as taskRoutes } from "./handler.ts";
```

## Testing

Uses **vitest** with Prisma Fabbrica for test factories.

### Handler E2E Tests

```typescript
// features/tasks/.test/handler.get-all.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { testClient } from "hono/testing";
import taskRoutes from "../handler.ts";
import { TaskFactory, resetSequence } from "./setup.ts";
import { prisma } from "@api/lib/db";

describe.sequential("GET /api/tasks", () => {
  const client = testClient(taskRoutes);

  afterEach(async () => {
    await prisma.task.deleteMany();
    resetSequence();
  });

  const testCases = [
    {
      name: "returns empty array when no tasks exist",
      setup: async () => {},
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual({ tasks: [] });
      },
    },
    {
      name: "returns all tasks ordered by createdAt desc",
      setup: async () => {
        await TaskFactory.createList(3);
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.tasks).toHaveLength(3);
      },
    },
  ];

  for (const tc of testCases) {
    it(tc.name, async () => {
      await tc.setup();
      const res = await client.$get();
      await tc.assert(res);
    });
  }
});
```

### Test Factories

```typescript
// lib/db/factory.ts
import { defineTaskFactory, initialize, resetSequence } from "./generated/fabbrica";
import { prisma } from "./index.ts";

initialize({ prisma });

export const TaskFactory = defineTaskFactory({
  defaultData: async ({ seq }) => ({
    title: `Task ${seq}`,
    description: `Description for task ${seq}`,
    status: "pending",
  }),
  traits: {
    completed: { data: { status: "completed" } },
    inProgress: { data: { status: "in_progress" } },
  },
});

export { resetSequence };
```

## Database

- **PostgreSQL** with Prisma 7
- **Adapter**: `@prisma/adapter-pg` with `pg` connection pool
- **Schema**: `src/lib/db/prisma/schema.prisma`
- **Generated client**: `src/lib/db/generated/client/`

## Import Aliases

```typescript
import { prisma } from "@api/lib/db";
import { logger } from "@api/lib/logger";
import { Errors, isDatabaseNotFound } from "@api/lib/error";
import { responseOk, responseBadRequest } from "@api/lib/http";
import { nowUTC, toUTC } from "@api/lib/time";
import { wrapAsyncWithLog } from "@api/lib/types/result/db";
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
# Or individual:
DB_HOST=localhost
DB_PORT=5432
DB_DBNAME=mydb
DB_USERNAME=postgres
DB_PASSWORD=postgres

# Server
PORT=8080
NODE_ENV=development
LOG_LEVEL=debug  # silent, error, warn, info, debug
TZ=Asia/Tokyo
```

## Related Documentation

- [Root CLAUDE.md](/workspace/main/CLAUDE.md) - Project overview
- [.claude/rules/coding-rules.md](/workspace/main/.claude/rules/coding-rules.md) - Detailed coding rules
- [.claude/rules/testing.md](/workspace/main/.claude/rules/testing.md) - Test patterns and TDD practices
- [.claude/rules/security.md](/workspace/main/.claude/rules/security.md) - Security guidelines
