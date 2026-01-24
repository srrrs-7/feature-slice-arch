# WorkFlow

Bun monorepo with Feature-Sliced Architecture for a full-stack Todo/Workflow application.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun 1.3.5 |
| **API** | Hono 4.11, Prisma 7, PostgreSQL, neverthrow |
| **Web** | Svelte 5, Vite 7, Tailwind CSS 4, shadcn-svelte |
| **Infrastructure** | Terraform, AWS (CloudFront, ECS Fargate, Aurora Serverless v2) |
| **Testing** | Vitest, Prisma Fabbrica |
| **Linting** | Biome, cspell |

## Prerequisites

- [Bun](https://bun.sh/) >= 1.3.5
- [Docker](https://www.docker.com/) (for PostgreSQL)
- [Terraform](https://www.terraform.io/) (for infrastructure, optional)

## Quick Start

```bash
# Install dependencies
bun install

# Start PostgreSQL (Docker)
docker compose up -d

# Setup database
bun run db:generate
bun run db:migrate:dev
bun run db:seed

# Start development servers
bun run dev
```

- **API**: http://localhost:8080
- **Web**: http://localhost:5173

## Project Structure

```
.
├── apps/
│   ├── api/          # Hono REST API with Feature-Sliced Architecture
│   ├── web/          # Svelte 5 SPA with Feature-Sliced Architecture
│   └── iac/          # Terraform AWS Infrastructure
├── packages/         # Shared packages (future use)
└── .claude/rules/    # Development guidelines and coding rules
```

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└─────────────────────────────┬───────────────────────────────┘
                              │
               ┌──────────────────────────┐
               │     CloudFront CDN       │
               └──────┬───────────┬───────┘
                      │           │
         ┌────────────┘           └────────────┐
         │ (path: /)                           │ (path: /api/*)
    ┌─────────┐                        ┌──────────────┐
    │   S3    │                        │     ALB      │
    │  (Web)  │                        └──────┬───────┘
    └─────────┘                               │
                                   ┌──────────┴──────────┐
                                   │  ECS Fargate (API)  │
                                   └──────────┬──────────┘
                                              │
                                   ┌──────────┴──────────┐
                                   │ Aurora Serverless v2│
                                   └─────────────────────┘
```

### Feature-Sliced Architecture

Both API and Web follow Feature-Sliced Architecture:

**API Feature Structure:**
```
features/{feature}/
├── index.ts          # Public API (exports types + routes)
├── domain/           # Domain types, entities, errors
├── service/          # Business logic (returns ResultAsync)
├── repository/       # Data access with Prisma
├── handler.ts        # Hono HTTP handlers
├── validator.ts      # Zod schemas
└── .test/            # Handler tests
```

**Web Feature Structure:**
```
features/{feature}/
├── pages/            # Page components
├── components/       # UI components
├── api/              # Hono RPC client
├── stores/           # Svelte stores
└── types/            # Type definitions
```

## Commands

### Development

```bash
bun run dev              # Run both API and Web
bun run dev:api          # Run API only (port 8080)
bun run dev:web          # Run Web only (port 5173)
```

### Testing

```bash
bun run test:run         # Run all tests
bun run test:coverage    # Run tests with coverage

# Run single test
bun test apps/api/src/features/tasks/.test/handler.get-all.test.ts
```

### Code Quality

```bash
bun run check            # Run all checks (spell, type, biome)
bun run check:type       # Type check all workspaces
bun run format           # Format with Biome
```

### Database

```bash
bun run db:generate      # Generate Prisma client
bun run db:migrate:dev   # Run migrations in dev
bun run db:migrate:reset # Reset database
bun run db:seed          # Seed database
```

### Infrastructure

```bash
cd apps/iac
make plan ENV=dev        # Terraform plan
make apply ENV=dev       # Terraform apply
```

## Environment Variables

### API (`apps/api/.env`)

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
# Or individual variables:
DB_HOST=localhost
DB_PORT=5432
DB_DBNAME=mydb
DB_USERNAME=postgres
DB_PASSWORD=postgres

# Server
PORT=8080
NODE_ENV=development
LOG_LEVEL=debug
```

### Web (`apps/web/.env`)

```bash
VITE_API_URL=http://localhost:8080
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
  (error) => handleError(error)
);
```

### Svelte 5 Runes (Web)

```svelte
<script lang="ts">
  let { task, onEdit } = $props();
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
```

### Type-Safe API Client (Web)

```typescript
import { hc } from "hono/client";
import type { AppType } from "@api/index";

const client = hc<AppType>(import.meta.env.VITE_API_URL);
const res = await client.api.tasks.$get();
```

## Documentation

- **CLAUDE.md** - AI assistant guidelines
- **apps/api/CLAUDE.md** - API-specific documentation
- **apps/web/CLAUDE.md** - Web-specific documentation
- **apps/iac/CLAUDE.md** - Infrastructure documentation
- **.claude/rules/** - Detailed coding rules and guidelines

## License

MIT
