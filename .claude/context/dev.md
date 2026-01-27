# Development Environment Setup

This document explains local prerequisites and the fastest path to a working dev environment.

## Prerequisites
- Bun 1.3.5+
- Git 2.40+
- A reachable PostgreSQL database
- Docker/Docker Compose are recommended but not required

## Quick Start (Repo Root)
```bash
bun install
bun run check
bun run dev
```

## Environment Variables
API: `apps/api/.env`
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mydb
PORT=8080
NODE_ENV=development
LOG_LEVEL=debug
TZ=Asia/Tokyo
```

Web: `apps/web/.env`
```env
VITE_API_URL=http://localhost:8080
VITE_AUTH_TOKEN=dummy-bearer-token-12345
VITE_TIMEZONE=Asia/Tokyo
```

## Database Setup
Use any reachable Postgres instance, then run:
```bash
bun run db:generate
bun run db:migrate:dev
bun run db:seed
```

## Useful Commands
- Dev servers: `bun run dev`, `bun run dev:api`, `bun run dev:web`
- Tests: `bun run test:run`, `bun run test:coverage`
- Quality: `bun run check`, `bun run format`
