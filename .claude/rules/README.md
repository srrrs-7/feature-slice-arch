# Rules Quick Reference

This folder defines project conventions. Prefer these rules over generic defaults.

## Files
- `coding-rules.md`: TypeScript, formatting, naming, date/time rules.
- `testing.md`: Testing strategy, TDD flow, and route-layer patterns.
- `planning.md`: When and how to plan before implementation.
- `github-pr.md`: Branch, commit, and PR expectations.
- `design-guide.md`: UI/UX guidance for the web app.
- `security.md`: Security practices and anti-patterns.

## Architecture Snapshot
- API layers: `domain -> service -> repository -> handler`.
- Web layers: `pages -> components -> api -> stores`.

## Core Principles
- Use `dayjs` for all date/time handling.
- Run `bun run check` before pushing.
- Keep changes small, testable, and well-scoped.
