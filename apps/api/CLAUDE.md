# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## API Application

REST API built with Hono and Feature-Sliced Architecture, using Prisma with PostgreSQL.

## Commands

```bash
# Development
bun run dev              # Start API server with HMR (hot module reload)
bun run start            # Start API server (production)

# Testing
bun run test             # Run tests with vitest
bun run test:watch       # Run tests in watch mode

# Build & Type Check
bun run build            # Build API
bun run check:type       # Type check with tsgo

# Database (Prisma)
bun run db:generate       # Generate Prisma client
bun run db:migrate:dev    # Run migrations in development
bun run db:migrate:deploy # Deploy migrations (production)
bun run db:migrate:reset  # Reset database (drop all data)
bun run db:studio         # Open Prisma Studio
bun run db:seed           # Seed database with initial data

# Clean
bun run clean            # Remove dist and node_modules
```

## Architecture

Feature-Sliced Architecture with strict layering:

```
src/
├── features/           # Feature modules (domains)
│   └── {feature}/
│       ├── index.ts        # Public API - exports types and routes
│       ├── domain/         # Domain layer
│       │   └── {name}.ts       # Domain types, entities, errors
│       ├── service/        # Service layer
│       │   ├── service.ts      # Business logic
│       │   └── service.test.ts # Service tests
│       ├── repository/     # Repository layer
│       │   └── repository.ts   # Data access with Prisma
│       ├── handler.ts      # HTTP handlers (Hono routes)
│       └── validator.ts    # Zod validation schemas
├── middleware/         # Hono middleware
│   ├── cors.ts         # CORS configuration
│   └── bearer.ts       # Bearer token authentication
├── lib/                # Shared workspace (@api/lib)
│   ├── db/             # Database configuration
│   ├── error/          # Common error types
│   ├── http/           # HTTP response helpers
│   ├── logger/         # Pino logger (with redaction)
│   ├── time/           # Time utilities
│   └── types/          # Shared types
└── index.ts            # Entry point - Hono app setup
```

## Layer Responsibilities

### Domain Layer (`domain/`)

**Purpose:** Define domain entities, types, and business rules.

- **Immutable types** - All properties are `readonly`
- **Branded types for IDs** - e.g., `type TaskId = string & { readonly _brand: unique symbol }`
- **Smart constructors** - Functions like `createTask()`, `createTaskId()` that create valid entities
- **Domain-specific errors** - e.g., `TaskNotFoundError`, `TaskAlreadyExistsError`
- **Error constructors** - Factory functions for creating errors (e.g., `TaskErrors.notFound()`)

Example:
```typescript
export type TaskId = string & { readonly _brand: unique symbol };

export interface Task {
  readonly id: TaskId;
  readonly title: string;
  readonly status: TaskStatus;
}

export const createTaskId = (id: string): TaskId => id as TaskId;
```

### Service Layer (`service/`)

**Purpose:** Business logic and validation.

- Validate inputs using Zod schemas
- Orchestrate calls to repositories
- Return `ResultAsync<T, Error>` for all operations
- Use functional composition: `.andThen()`, `.map()`, `.mapErr()`
- No direct HTTP concerns (handlers do that)

Example:
```typescript
export const getTaskById = (id: string): ResultAsync<Task, TaskError> =>
  liftAsync(parseWith(taskIdSchema, id))
    .andThen(taskRepository.findById);
```

### Repository Layer (`repository/`)

**Purpose:** Data access with Prisma.

- Direct Prisma client access
- Return `ResultAsync<T, Error>` wrapped results
- Use `wrapAsync()` or `wrapAsyncWithLog()` helpers
- Map Prisma types to domain types
- Handle Prisma errors (e.g., P2025 for not found)

Example:
```typescript
export const findById = (id: TaskId): ResultAsync<Task, TaskError> =>
  wrapAsyncWithLog(
    "taskRepository.findById",
    { id },
    () => prisma.task.findUniqueOrThrow({ where: { id } }),
    TaskErrors.database
  ).andThen(/* map to domain type */);
```

### Handler Layer (`handler.ts`)

**Purpose:** HTTP request/response handling.

- Define Hono routes
- Validate with `@hono/zod-validator`
- Call service functions
- Use `.match()` to handle `Result` types
- Map errors to HTTP responses using `@api/lib/http` helpers
- Export default Hono app

Example:
```typescript
export default new Hono()
  .get("/:id", zValidator("param", idParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    return taskService.getById(id).match(
      (task) => responseOk(c, { task }),
      (error) => {
        switch (error.type) {
          case "NOT_FOUND": return responseNotFound(c);
          case "DATABASE_ERROR": return responseDBAccessError(c);
        }
      }
    );
  });
```

### Public API (`index.ts`)

**Purpose:** Export public interface of the feature.

- Export domain types (not implementations)
- Export route handler
- This is what other features can import

Example:
```typescript
export type { Task, TaskId, TaskError } from "./domain/task.ts";
export { default as taskRoutes } from "./handler.ts";
```

## Error Handling Pattern

Uses **neverthrow** for functional error handling:

1. **Define errors** in domain layer
2. **Return `Result<T, E>` or `ResultAsync<T, E>`** from all operations
3. **Compose with `.andThen()`** for sequential operations
4. **Handle with `.match()`** at the HTTP boundary

Common error types (from `@api/lib/error`):
- `DatabaseError` - Database access errors
- `ValidationError` - Input validation failures
- `NotFoundError` - Resource not found
- `UnauthorizedError` - Authentication required
- `ForbiddenError` - Authorization failed

## Testing

Uses **vitest** (not `bun:test`):

```typescript
import { describe, it, expect, beforeEach } from "vitest";

describe("TaskService", () => {
  it("should create a task", async () => {
    const result = await createTask({ title: "Test" });
    expect(result.isOk()).toBe(true);
  });
});
```

Test factories with `@quramy/prisma-fabbrica`:
```typescript
import { defineTaskFactory } from "@api/lib/db/factory";

const TaskFactory = defineTaskFactory();
const task = await TaskFactory.create();
```

## Database

- **PostgreSQL** with Prisma 7
- **Adapter**: `@prisma/adapter-pg` with `pg` connection pool
- **Schema**: `src/lib/db/prisma/schema.prisma`
- **Generated client**: `src/lib/db/generated/client/`
- **Migrations**: `src/lib/db/prisma/migrations/`

Environment variables for database connection:
```bash
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
# Or individual variables:
DB_HOST=localhost
DB_PORT=5432
DB_DBNAME=mydb
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

## Middleware

### CORS (`middleware/cors.ts`)

Configured for local development:
- Allowed origins: `http://localhost:3000`, `http://localhost:5173`
- Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- Credentials: enabled

### Bearer Authentication (`middleware/bearer.ts`)

Simple Bearer token authentication:
- Validates `Authorization: Bearer <token>` header
- Returns 401 for missing/invalid authorization
- Applied to `/api/*` routes

## Logger

Uses **pino** with automatic redaction of sensitive fields:

```typescript
import { logger, createLogger } from "@api/lib/logger";

// Basic usage
logger.info({ port }, "Server running");
logger.error({ err }, "Server error");

// Child logger for specific module
const log = createLogger("taskService");
log.debug({ taskId }, "Fetching task");
```

**Redacted fields**: password, secret, token, authorization, apiKey, creditCard, ssn

## Bun-Specific Notes

- Bun auto-loads `.env` (no dotenv needed)
- Use `bun --hot` for HMR in development
- The API uses `pg` with Prisma adapter (not `Bun.sql` yet)
- Tests use vitest (better Prisma support than `bun:test`)
