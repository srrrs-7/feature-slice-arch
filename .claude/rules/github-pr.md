# GitHub PR Rules

How to branch, commit, and open pull requests.

## Branch Naming
- `feat/...`: new features
- `fix/...`: bug fixes
- `refactor/...`: refactors
- `test/...`: test changes
- `docs/...`: documentation
- `chore/...`: maintenance

## Commits
- Prefer Conventional Commits: `type(scope): summary`.
- Keep commits focused and include related tests.

## PR Requirements
- Clear description of what changed and why.
- Notes on schema/env/infra changes.
- Screenshots or recordings for UI changes.
- Confirm `bun run check` passes.
