# Planning Rules

Create a plan before implementation when changes are broad, risky, or cross-cutting.

## Plan First When
- Adding a new feature under `features/{feature}/`.
- Changing architecture, dependencies, or data models.
- Refactoring across multiple files or layers.
- Modifying infrastructure, build pipelines, or schemas.

## Planning Process
1. Define requirements and scope.
2. Identify impacted layers/files.
3. List risks, migrations, and rollout notes.
4. Break work into small, testable steps.

## Deliverables
- A short written plan (bulleted is fine).
- A checklist of implementation steps.
- A test plan (status codes, edge cases, regressions).
