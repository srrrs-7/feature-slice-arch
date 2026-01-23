# Prisma Migration Docker Image

Lightweight container for running database migrations in AWS ECS.

## Overview

This Dockerfile creates a minimal image containing only:
- Bun runtime
- Prisma CLI
- Schema and migration files

## Build

```bash
# From repository root
docker build -t migration -f apps/api/src/lib/db/.image/Dockerfile .

# With ECR tag
docker build -t <account>.dkr.ecr.<region>.amazonaws.com/<repo>:migration \
  -f apps/api/src/lib/db/.image/Dockerfile .
```

## Run Locally

```bash
docker run --rm \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  migration
```

## CI/CD Usage

The GitHub Actions workflow builds and pushes this image with the `:migration` tag, then runs it as an ECS task before deploying the API.

```yaml
# Build migration image
docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:migration \
  -f apps/api/src/lib/db/.image/Dockerfile .

# Run as ECS task
aws ecs run-task \
  --cluster $CLUSTER \
  --task-definition $TASK_DEF \
  --overrides '{"containerOverrides":[{"name":"migration","command":[]}]}'
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |

## Files Included

```
/app/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Migration files
│       ├── 20260123.../
│       │   └── migration.sql
│       └── migration_lock.toml
└── node_modules/
    └── prisma/            # Prisma CLI
```

## Image Size

~50MB (compared to ~200MB+ for full API image)
