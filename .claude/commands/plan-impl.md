---
description: Plan and implement a feature following TDD, project guidelines, and coding standards
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Plan and implement a feature or refactoring task following Test-Driven Development (TDD) methodology, adhering to project guidelines and coding standards. This command enforces best practices through structured planning, validation, and implementation phases.

## Prerequisites

Before starting, ensure you have read and understand:
- **Coding Standards**: `/workspace/main/.claude/rules/coding-rules.md`
- **Testing & TDD**: `/workspace/main/.claude/rules/testing.md`
- **Planning Process**: `/workspace/main/.claude/rules/planning.md`
- **Security**: `/workspace/main/.claude/rules/security.md`

## Phase 0: Load Project Context

**CRITICAL**: Read all rule files before proceeding with implementation.

```bash
# Read project rules in parallel
cat /workspace/main/.claude/rules/coding-rules.md
cat /workspace/main/.claude/rules/testing.md
cat /workspace/main/.claude/rules/planning.md
cat /workspace/main/.claude/rules/security.md
```

**Parse and internalize:**
- TDD methodology (Red-Green-Refactor cycle)
- Feature-Sliced Architecture patterns
- Naming conventions and code style
- Testing strategies and patterns
- Planning requirements and templates

## Phase 1: Requirement Analysis

### 1.1 Parse User Request

From `$ARGUMENTS`, identify:
- **Feature Type**: New feature, bug fix, refactor, enhancement
- **Scope**: API only, Web only, or Full-stack
- **Complexity**: Simple (1-2 files), Medium (3-10 files), Complex (10+ files)

### 1.2 Determine Planning Requirement

**Require planning document if:**
- Adding new feature (`features/{feature}/`)
- Multiple files involved (3+ files)
- Database schema changes
- Architecture changes
- New library introduction

**Skip planning for:**
- Single-file bug fixes
- Simple refactoring (rename, extract function)
- Documentation updates
- Configuration tweaks

### 1.3 Validate Prerequisites

Check if prerequisites exist:

```bash
# Check if API is set up
test -f /workspace/main/apps/api/package.json && echo "API: OK" || echo "API: NOT FOUND"

# Check if Web is set up
test -f /workspace/main/apps/web/package.json && echo "Web: OK" || echo "Web: NOT FOUND"

# Check if database is configured
test -f /workspace/main/apps/api/src/lib/db/prisma/schema.prisma && echo "Prisma: OK" || echo "Prisma: NOT FOUND"

# Check git status
git status --short
```

**If uncommitted changes exist**, ask user:
- "You have uncommitted changes. Should I commit them first? (yes/no)"
- If yes, create a commit following the project's commit conventions

## Phase 2: Planning (if required)

### 2.1 Create TODO List (TDD Requirement)

**Following `/workspace/main/.claude/rules/testing.md` Step 1:**

Create a comprehensive TODO list before writing any code.

```markdown
## TODO List

### Feature: [Feature Name]

#### Domain Layer
- [ ] Define domain types (Branded Types, interfaces)
- [ ] Define error types (discriminated unions)
- [ ] Create Smart Constructors
- [ ] Create Error Constructors

#### Tests (Write FIRST)
- [ ] Write service unit tests (all edge cases)
- [ ] Write handler E2E tests (table-driven)
- [ ] Write validation tests

#### Service Layer
- [ ] Implement create operation
- [ ] Implement read operations (getById, getAll)
- [ ] Implement update operation
- [ ] Implement delete operation
- [ ] Add input validation with Zod

#### Repository Layer
- [ ] Implement database access methods
- [ ] Add error handling with wrapAsync
- [ ] Add transaction support if needed

#### Handler Layer
- [ ] Implement HTTP routes
- [ ] Add request validation
- [ ] Add response formatting
- [ ] Add error handling

#### Database
- [ ] Design Prisma schema
- [ ] Create migration
- [ ] Create factory for testing
- [ ] Verify migration safety

#### Integration
- [ ] Mount routes in main app
- [ ] Update API types export
- [ ] Test end-to-end flow

### Web (if applicable)
#### Types
- [ ] Define client-side types
- [ ] Create type aliases for API responses

#### API Client
- [ ] Create Hono RPC client
- [ ] Create API wrapper functions
- [ ] Add error handling

#### Stores
- [ ] Create state stores (writable)
- [ ] Create derived stores (computed)
- [ ] Add CRUD operations with optimistic updates
- [ ] Add loading/error states

#### Components
- [ ] Create list component
- [ ] Create card/item component
- [ ] Create form components (create/edit)
- [ ] Create action components (delete/confirm)
- [ ] Create filter/search components

#### Integration
- [ ] Create main page component
- [ ] Test full CRUD flow
- [ ] Test error scenarios
- [ ] Test loading states
```

### 2.2 Create Design Document

**For API features**, create: `apps/api/src/features/{feature}/.docs/design.md`

**For Web features**, create: `apps/web/src/features/{feature}/.docs/design.md`

Follow the template in `/workspace/main/.claude/rules/planning.md`.

### 2.3 User Approval

Present the TODO list and design document to the user:

```
I've created a comprehensive plan for implementing [Feature Name]:

📋 TODO List: [X] items
📄 Design Document: Created at [path]

Key points:
- [Summary point 1]
- [Summary point 2]
- [Summary point 3]

This will follow TDD methodology:
1. Write tests first (Red)
2. Implement to pass tests (Green)
3. Refactor while keeping tests green (Refactor)

Estimated time: X hours

Would you like me to proceed with the implementation? (yes/no/modify)
```

**Wait for user response.**

## Phase 3: TDD Implementation

### 3.1 Setup Phase

Create directory structure following Feature-Sliced Architecture.

### 3.2 Red Phase - Write Failing Tests

**Following TDD Rules:** Write tests BEFORE implementation.

```typescript
// Example: service/service.test.ts
import { describe, test, expect } from "vitest";

describe.sequential("featureService.create", () => {
  const testCases = [
    {
      name: "should create with valid input",
      input: { name: "Test" },
      expected: { name: "Test" },
    },
    {
      name: "should reject empty input",
      input: { name: "" },
      expectedError: "VALIDATION_ERROR",
    },
  ];

  for (const tc of testCases) {
    test(tc.name, async () => {
      // Test implementation
    });
  }
});
```

Run tests - they should FAIL (Red phase).

### 3.3 Green Phase - Make Tests Pass

Write minimal code to pass tests.

Follow coding standards from `/workspace/main/.claude/rules/coding-rules.md`:
- Branded types for IDs
- Immutable interfaces with readonly
- Smart constructors
- Error constructors
- ResultAsync for error handling

### 3.4 Refactor Phase

Refactor while keeping tests green.

### 3.5 Repeat for Each TODO Item

Continue Red-Green-Refactor cycle for all TODO items.

## Phase 4: Integration & Verification

### 4.1 Database Migration

```bash
cd apps/api
bun run db:migrate:dev
```

### 4.2 Mount Routes

Update main app to include new routes.

### 4.3 Run All Tests

```bash
bun run test:run
```

### 4.4 Type Check

```bash
bun run check:type
```

### 4.5 Lint & Format

```bash
bun run check:biome
```

### 4.6 Manual Testing

Start dev servers and test CRUD operations.

## Phase 5: Completion

### 5.1 Create Commit

```bash
git add .
git commit -m "feat: add [feature] with TDD

Implementation following TDD methodology.
All tests passing.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### 5.2 Report Completion

```
✅ Implementation Complete: [Feature Name]

📊 Statistics:
- Files created: X
- Tests written: Y
- Tests passing: Y/Y (100%)

📝 Followed:
- ✓ TDD methodology
- ✓ Feature-Sliced Architecture
- ✓ Project coding standards

Ready for PR creation (use /create-pr)
```

## Best Practices

This command enforces:
1. **TDD First** - Tests before code
2. **Small Steps** - One item at a time
3. **Type Safety** - Branded types, strict TS
4. **Error Handling** - ResultAsync
5. **Architecture** - Feature-Sliced
6. **Testing** - Table-driven patterns
7. **Documentation** - Design docs

## References

- `/workspace/main/.claude/rules/coding-rules.md` - Coding standards
- `/workspace/main/.claude/rules/testing.md` - Testing patterns and TDD
- `/workspace/main/.claude/rules/planning.md` - Planning process
- `/workspace/main/.claude/rules/security.md` - Security guidelines
