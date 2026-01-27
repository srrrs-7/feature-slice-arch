# Repository Guidelines

## Project Structure & Module Organization
This is a Bun workspace monorepo. Primary code lives under `apps/`.
- `apps/api`: Hono + Prisma TypeScript backend (`src/` organized by `features/`, `domain/`, `middleware/`, and `lib/`).
- `apps/web`: Svelte 5 + Vite frontend (`src/` plus `src/lib` and `src/features`).
- `apps/iac`: Terraform infrastructure and deploy scripts (`modules/`, `envs/`, `scripts/`).
Root tooling/config includes `biome.jsonc` (format/lint), `cspell.config.yaml`, `.husky/`, and `bunfig.toml`.

## Build, Test, and Development Commands
Run commands from the repo root unless noted.
- `bun run dev`: Start API and web dev servers concurrently.
- `bun run dev:api` / `bun run dev:web`: Start a single app.
- `bun run build:api` / `bun run build:web`: Build production artifacts.
- `bun run test:run`: Run API tests once (Vitest).
- `bun run test:coverage`: Run API tests with coverage output.
- `bun run check`: Run spellcheck, type checks, and Biome checks.
- `bun run format`: Apply Biome formatting.

## Coding Style & Naming Conventions
Biome is the source of truth for formatting and linting.
- Indentation: spaces (per `biome.jsonc`).
- Prefer explicit types at module boundaries and clear, readable code.
- Naming: `camelCase` for variables/functions, `PascalCase` for types/components, `kebab-case` for file names where practical.
Examples: `apps/api/src/features/auth/login.ts`, `apps/web/src/lib/components/Button.svelte`.

## Testing Guidelines
Backend tests use Vitest (`apps/api/vitest.config.ts`).
- Place tests near features or under `__tests__` with `*.test.ts` naming.
- Focus on feature-level behavior and API contracts.
- Run: `bun run test:run` or `cd apps/api && bun run test:watch`.

## Commit & Pull Request Guidelines
Git history is mixed, but `docs:` prefixes appear. Prefer Conventional Commits.
- Format: `type(scope): summary` (e.g., `feat(api): add session refresh`).
- Keep commits focused and include related tests/updates.
PRs should include:
- A short description of intent and impact.
- Linked issues/tasks when relevant.
- Notes on schema, env, or Terraform changes.
- Screenshots/GIFs for UI changes in `apps/web`.

## Security & Configuration Tips
- Do not commit secrets. `.env` files exist locally under `apps/api` and `apps/web`.
- Use the provided DB scripts via root commands (e.g., `bun run db:migrate:dev`).
- Treat `apps/iac/envs/*` changes as production-impacting; call them out in PRs.
