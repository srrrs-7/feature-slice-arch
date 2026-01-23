# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bun monorepo with Feature-Sliced Architecture for the API. Uses Bun workspaces with `apps/*` and `packages/*`.

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
│       └── repository/     # Data access layer
├── shared/             # Shared utilities
│   ├── db/
│   ├── logger/
│   └── time/
├── index.ts            # Entry point
└── routes.ts           # Route definitions
```

New features should follow `.example/` as a template.

### Web (`apps/web`)

Bun-native frontend using `Bun.serve()` with HTML imports.

## Bun-Specific Guidelines

- Use `Bun.serve()` for HTTP servers (not Express)
- Use `bun:test` for testing (not Jest/Vitest)
- Use `Bun.file` for file operations (not node:fs)
- Bun auto-loads `.env` files (no dotenv needed)
- Use `bun:sqlite` for SQLite, `Bun.sql` for Postgres, `Bun.redis` for Redis
