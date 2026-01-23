# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bun monorepo with Feature-Sliced Architecture for the API. Uses Bun workspaces with `apps/*` and `packages/*`.

```
apps/
├── api/     # Hono + Prisma REST API
├── web/     # Svelte 5 + Vite SPA
└── iac/     # Terraform AWS Infrastructure
```

## Commands

```bash
# Install dependencies
bun install

# Development
bun run dev          # Run both api and web
bun run dev:api      # Run API only (HMR enabled)
bun run dev:web      # Run web only (HMR enabled)

# Testing
bun run test:run     # Run tests once
bun run test:watch   # Run tests in watch mode

# Build & Type Check
bun run build:api    # Build API
bun run build:web    # Build web
bun run check:type   # Type check all workspaces
bun run check        # Run spell check, type check, and biome

# Linting & Formatting
bun run format       # Format with Biome
bun run check:biome  # Lint and fix with Biome

# Database (Prisma)
bun run db:generate       # Generate Prisma client
bun run db:migrate:dev    # Run migrations in dev
bun run db:migrate:deploy # Deploy migrations to prod
bun run db:migrate:reset  # Reset database
bun run db:seed           # Seed database
```

## Shell Aliases

For faster development workflow, the following aliases are available in the devcontainer (configured in `.devcontainer/setup.personal.sh`):

```bash
# Basic shortcuts
b          # bun
g          # git
ll         # ls -la (detailed list)
la         # ls -A (show hidden files)
l          # ls -CF
c          # clear
h          # history
..         # cd ..
...        # cd ../..

# Bun shortcuts
bi         # bun install
bd         # bun run dev (API + Web)
bda        # bun run dev:api
bdw        # bun run dev:web
bt         # bun run test:run
btw        # bun run test:watch
bc         # bun run check
bf         # bun run format
bb         # bun run build:api

# Database shortcuts
dbg        # bun run db:generate
dbm        # bun run db:migrate:dev
dbd        # bun run db:migrate:deploy
dbs        # bun run db:studio
dbseed     # bun run db:seed
dbr        # bun run db:migrate:reset

# Git shortcuts
gs         # git status
gc         # git commit
gp         # git push
gl         # git log --oneline --graph --decorate
gco        # git checkout
gcb        # git checkout -b (create new branch)
gaa        # git add --all
gcm        # git commit -m
gca        # git commit --amend
gst        # git stash
gstp       # git stash pop
gpl        # git pull
gpf        # git push --force-with-lease
gd         # git diff
gds        # git diff --staged
grb        # git rebase
grbc       # git rebase --continue
grba       # git rebase --abort

# Utilities
reload     # source ~/.bashrc (reload aliases)
path       # echo $PATH (display PATH nicely)
ports      # lsof -i -P -n | grep LISTEN (show listening ports)
```

**Usage examples:**
```bash
# Quick development
bd                    # Start both API and Web servers
bda                   # Start API only
bt                    # Run tests

# Database operations
dbm                   # Run migrations
dbs                   # Open Prisma Studio
dbg                   # Generate Prisma client

# Git workflow
gs                    # Check status
gcb feat/new-feature  # Create and checkout new branch
gaa                   # Stage all changes
gcm "feat: add user auth"  # Commit with message
gp                    # Push to remote

# Utilities
reload                # Reload aliases after editing .bashrc
ports                 # Check which ports are in use
```

## Architecture

### API (`apps/api`)

Feature-Sliced Architecture with layers:

```
apps/api/
├── features/           # Feature modules
│   └── {feature}/
│       ├── index.ts        # Public API (exports)
│       ├── domain/         # Domain types and entities
│       ├── service/        # Business logic
│       ├── repository/     # Data access layer
│       ├── handler.ts      # HTTP route handlers (Hono)
│       └── validator.ts    # Zod schemas for validation
├── lib/                # Shared utilities (workspace: @api/lib)
│   ├── db/             # Prisma client, schema, migrations
│   ├── error/          # Common error types
│   ├── http/           # HTTP response helpers
│   ├── logger/         # Pino logger
│   ├── time/           # Time utilities
│   └── types/          # Shared types (Result wrappers)
├── index.ts            # Entry point (Hono app)
└── package.json
```

New features should follow `.example/` as a template.

### Web (`apps/web`)

Svelte 5 SPA with Vite, Tailwind CSS 4, and shadcn-svelte UI components.

```
apps/web/
├── src/
│   ├── features/           # Feature modules
│   │   └── {feature}/
│   │       ├── pages/          # Page components
│   │       ├── components/     # UI components
│   │       ├── api/            # Hono RPC client
│   │       ├── stores/         # Svelte stores
│   │       └── types/          # Type definitions
│   ├── lib/
│   │   ├── components/ui/  # shadcn-svelte components
│   │   └── utils/          # Utility functions
│   ├── App.svelte          # Root component
│   └── main.ts             # Entry point
├── index.html
└── vite.config.ts
```

## Bun-Specific Guidelines

- Use `Bun.serve()` for HTTP servers (not Express)
- Use `bun:test` for testing (not Jest/Vitest)
- Use `Bun.file` for file operations (not node:fs)
- Bun auto-loads `.env` files (no dotenv needed)
- Use `bun:sqlite` for SQLite, `Bun.sql` for Postgres, `Bun.redis` for Redis

## Key Architectural Patterns

### Error Handling with neverthrow

The API uses functional error handling with the `neverthrow` library:

- All service/repository functions return `Result<T, E>` or `ResultAsync<T, E>`
- Error types are defined in `domain/` and `lib/error/`
- Use `.match()` to handle success/error cases in handlers
- Common error types: `DatabaseError`, `ValidationError`, `NotFoundError`

Example:
```typescript
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

### Domain Layer

- All domain types are **immutable** (use `readonly`)
- Use branded types for IDs (e.g., `TaskId = string & { readonly _brand: unique symbol }`)
- Smart constructors create domain entities (e.g., `createTask()`, `createTaskId()`)
- Domain-specific errors defined alongside entities

### Service Layer

- Validates input using Zod schemas
- Orchestrates business logic
- Returns `ResultAsync<T, Error>` for all operations
- Uses functional composition with `.andThen()`, `.map()`, `.mapErr()`

### Repository Layer

- Direct Prisma access
- Returns `ResultAsync` with typed errors
- Uses `wrapAsync()` or `wrapAsyncWithLog()` helpers from `@api/lib/db`

### Handler Layer (HTTP)

- Uses Hono for routing
- Validates with `@hono/zod-validator`
- Maps service results to HTTP responses using helpers from `@api/lib/http`
- Exports as default Hono app

## Database (Prisma)

- PostgreSQL with Prisma adapter (`@prisma/adapter-pg`)
- Schema: `apps/api/src/lib/db/prisma/schema.prisma`
- Generated client: `apps/api/src/lib/db/generated/client/`
- Test factories: `@quramy/prisma-fabbrica` in `generated/fabbrica/`

## Timezone Handling

**Critical: All timestamps must use UTC throughout the system.**

### Backend (API)
- **Database**: Store all timestamps in UTC (PostgreSQL default with `TIMESTAMP` or `TIMESTAMP WITH TIME ZONE`)
- **API Responses**: Return all timestamps in UTC (ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`)
- **No timezone conversion** in backend - keep everything in UTC

### Frontend (Web)
- **Display**: Convert UTC timestamps to user's local timezone for display
- **Input**: Convert user's local date/time inputs to UTC before sending to API
- **Requests**: Always send date/time values in UTC format to the backend

### Benefits
- Eliminates timezone-related bugs
- Consistent data storage and retrieval
- Easy to support users in different timezones
- Simplifies backend logic (no timezone conversions needed)

### Example
```typescript
// Backend response (UTC)
{
  "createdAt": "2025-01-23T08:00:00.000Z",  // Always UTC
  "updatedAt": "2025-01-23T09:30:00.000Z"   // Always UTC
}

// Frontend display (converts to user's timezone)
const date = new Date("2025-01-23T08:00:00.000Z");
console.log(date.toLocaleString()); // "2025/1/23 17:00:00" (JST)

// Frontend request (converts back to UTC)
const localDate = new Date("2025-01-23T17:00:00"); // User's local time
const utcDate = localDate.toISOString(); // "2025-01-23T08:00:00.000Z"
```

## Infrastructure (`apps/iac`)

Terraform-based AWS infrastructure with modular architecture.

```bash
# From apps/iac directory
make plan ENV=dev      # Terraform plan
make apply ENV=dev     # Terraform apply
make validate ENV=dev  # Validate configuration
```

**Architecture**: CloudFront → ALB → ECS Fargate → Aurora Serverless v2

See `apps/iac/CLAUDE.md` for detailed infrastructure documentation.
