# Coding Rules

Project-specific coding standards for API and web code.

## General Principles

### TypeScript
- Strict mode is required.
- Prefer explicit types at module boundaries.
- Avoid `any`; use `unknown` and narrow.
- Minimize non-null assertions (`!`).

### Date/Time
- Always use `dayjs` for creation, parsing, comparison, and formatting.
- Avoid direct `Date` manipulation (`new Date()`, `Date.parse`, etc.) in runtime code.
- Use ISO strings at boundaries (API I/O), and `dayjs` internally.

```ts
import dayjs from "dayjs";

const now = dayjs();
const due = dayjs(dueAtIso);
const isOverdue = due.isBefore(now);
const label = due.format("YYYY-MM-DD HH:mm");
```

### Naming
- Use kebab-case for file names: `task-service.ts`, `task-list.svelte`.
- Use `camelCase` for variables/functions and `PascalCase` for types/components.

### Formatting & Linting
- Biome is the source of truth.
- Indentation: 2 spaces.
- Quotes: double quotes.
- Run: `bun run format` and `bun run check`.
