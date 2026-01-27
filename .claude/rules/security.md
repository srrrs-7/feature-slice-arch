# Security Rules

Security practices and anti-patterns for this repo.

## Data Access
- Use Prisma parameterized queries.
- Avoid string-concatenated SQL.

## Auth & Sessions
- Prefer httpOnly cookies for refresh tokens.
- Do not store sensitive tokens in localStorage.

## Input Validation
- Validate all external input with Zod.
- Fail fast with clear, safe error messages.

## Secrets
- Never commit secrets or real tokens.
- Use `.env` locally and document required keys.
