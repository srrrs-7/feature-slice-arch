# Testing Rules

Testing strategy and practical patterns for this repository.

## Strategy
- Follow the test pyramid: many unit tests, fewer integration tests, minimal E2E.
- Coverage target: 80%+ for lines, functions, branches, and statements.
- After adding tests, run coverage: `bun run test:coverage`.

## TDD Flow
1. Red: write a failing test.
2. Green: implement the smallest change to pass.
3. Refactor: clean up while staying green.

## API Testing (Vitest + Prisma Fabbrica)

### Structure
```
features/{feature}/
|-- service/
|   `-- service.test.ts
`-- .test/
    |-- setup.ts
    `-- handler.*.test.ts
```

### Route-Layer Pattern (Required)
Route and handler tests must be grouped by HTTP status, with cases nested under each status.

```ts
describe.sequential("POST /api/tasks", () => {
  const cases = [
    { name: "valid", expectedStatus: 201 },
    { name: "missing title", expectedStatus: 400 },
  ] as const;

  const byStatus = new Map<number, typeof cases>();
  for (const tc of cases) {
    const list = byStatus.get(tc.expectedStatus) ?? [];
    byStatus.set(tc.expectedStatus, [...list, tc]);
  }

  for (const [status, group] of byStatus) {
    describe(`HTTP ${status}`, () => {
      for (const tc of group) {
        it(tc.name, async () => {
          const ctx = await tc.setup?.();
          const res = await tc.execute(ctx);
          expect(res.status).toBe(status);
          await tc.assert(res, ctx);
        });
      }
    });
  }
});
```

## Pre-commit Expectation
- `bun run check` should pass locally before pushing.
