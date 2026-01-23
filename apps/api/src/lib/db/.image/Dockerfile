# =============================================================================
# Prisma Migration Dockerfile
# =============================================================================
# Lightweight container for running database migrations in ECS
# Usage: docker build -t migration -f apps/api/src/lib/db/.image/Dockerfile .
# =============================================================================

FROM oven/bun:1.3.5-alpine AS migration

WORKDIR /app

# Copy only files needed for Prisma migrations
COPY apps/api/src/lib/db/prisma/schema.prisma ./prisma/
COPY apps/api/src/lib/db/prisma/migrations ./prisma/migrations/

# Install Prisma CLI only
RUN bun add prisma@^7

# Environment variables
ENV NODE_ENV=production

# Run migrations and exit
# DATABASE_URL must be provided at runtime
CMD ["bunx", "prisma", "migrate", "deploy", "--schema", "./prisma/schema.prisma"]
