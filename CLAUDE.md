# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bun monorepo with Feature-Sliced Architecture. Uses Bun workspaces with `apps/*` and `packages/*`.

```
apps/
├── api/     # Hono + Prisma 7 REST API
├── web/     # Svelte 5 + Vite SPA
└── iac/     # Terraform AWS Infrastructure
```

## Commands

```bash
# Development
bun run dev              # Run both api and web
bun run dev:api          # Run API only (port 8080, HMR)
bun run dev:web          # Run web only (port 5173)

# Testing
bun run test:run         # Run all tests
bun run test:coverage    # Run tests with coverage
bun test apps/api/src/features/tasks/.test/handler.get-all.test.ts  # Single test

# Build & Checks
bun run check            # Run spell check, type check, and biome
bun run check:type       # Type check all workspaces
bun run format           # Format with Biome

# Database (Prisma)
bun run db:generate      # Generate Prisma client
bun run db:migrate:dev   # Run migrations in dev
bun run db:migrate:reset # Reset database
bun run db:seed          # Seed database
```

## Architecture

### API (`apps/api`)

Feature-Sliced Architecture with layers:

```
apps/api/src/
├── features/           # Feature modules
│   └── {feature}/
│       ├── index.ts        # Public API (exports types + routes)
│       ├── domain/         # Domain types, entities, errors
│       ├── service/        # Business logic (returns ResultAsync)
│       ├── repository/     # Data access with Prisma
│       ├── handler.ts      # Hono HTTP handlers
│       ├── validator.ts    # Zod schemas
│       └── .test/          # Handler tests
├── lib/                # Shared utilities (@api/lib workspace)
└── index.ts            # Entry point
```

New features should follow `features/.example/` as a template.

### Web (`apps/web`)

Svelte 5 SPA with Feature-Sliced Architecture:

```
apps/web/src/
├── features/           # Feature modules
│   └── {feature}/
│       ├── pages/          # Page components
│       ├── components/     # UI components
│       ├── api/            # Hono RPC client
│       ├── stores/         # Svelte stores
│       └── types/          # Type definitions
├── lib/
│   ├── components/ui/  # shadcn-svelte components
│   └── utils/          # Utility functions
├── App.svelte          # Root component with routing
└── main.ts             # Entry point
```

## Key Patterns

### Error Handling (API)

Uses `neverthrow` for functional error handling:

```typescript
// Service returns ResultAsync
export const getById = (id: string): ResultAsync<Task, TaskError> =>
  liftAsync(parseWith(taskIdSchema, id))
    .andThen(taskRepository.findById);

// Handler uses .match() for HTTP responses
taskService.getById(id).match(
  (task) => responseOk(c, { task }),
  (error) => {
    switch (error.type) {
      case "NOT_FOUND": return responseNotFound(c);
      case "DATABASE_ERROR": return responseDBAccessError(c);
    }
  }
);
```

### Domain Layer (API)

- Immutable types with `readonly`
- Branded types for IDs: `type TaskId = string & { readonly _brand: unique symbol }`
- Smart constructors: `createTask()`, `createTaskId()`
- Domain errors: `TaskErrors.notFound(id)`

### Svelte 5 (Web)

```svelte
<script lang="ts">
  // Runes for props
  let { task, onEdit } = $props();

  // State
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>

<!-- Store subscription with $ prefix -->
{#each $tasks as task (task.id)}
  <TaskCard {task} />
{/each}
```

### API Integration (Web)

```typescript
// Hono RPC Client (type-safe)
import { hc } from "hono/client";
import type { AppType } from "@api/index";

const client = hc<AppType>(import.meta.env.VITE_API_URL);
const res = await client.api.tasks.$get();
```

## Database

- PostgreSQL with Prisma 7 + `@prisma/adapter-pg`
- Schema: `apps/api/src/lib/db/prisma/schema.prisma`
- Test factories: `@quramy/prisma-fabbrica`

## Timezone Handling

**All timestamps use UTC:**
- Backend: Store and return UTC (ISO 8601)
- Frontend: Convert to local timezone for display

## Infrastructure (`apps/iac`)

Terraform-based AWS: CloudFront → ALB → ECS Fargate → Aurora Serverless v2

```bash
make plan ENV=dev      # Terraform plan
make apply ENV=dev     # Terraform apply
```

See `apps/iac/CLAUDE.md` for detailed documentation.

## Additional Guidelines

Detailed coding rules, TDD practices, and PR templates are in `.claude/rules/`:
- `coding-rules.md` - TypeScript, API, and Web conventions
- `testing.md` - Test patterns with vitest and Prisma Fabbrica
- `tdd.md` - Test-Driven Development practices
- `github-pr.md` - PR creation templates
- `design-guide.md` - UI/UX design guidelines
