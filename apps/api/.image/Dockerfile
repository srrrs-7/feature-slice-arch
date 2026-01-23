# =============================================================================
# AWS ECS Deployment Dockerfile for Bun API
# =============================================================================
# Multi-stage build for optimized production image
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.5-alpine AS deps

WORKDIR /app

# Copy root package files for workspace setup
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/src/lib/package.json ./apps/api/src/lib/

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.5-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/src/lib/package.json ./apps/api/src/lib/

# Install all dependencies (including devDependencies for Prisma generation)
RUN bun install --frozen-lockfile

# Copy source code
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/

# Generate Prisma client
RUN cd apps/api/src/lib && bunx prisma generate

# Build the application (optional - Bun can run TS directly)
# RUN cd apps/api && bun build ./src/index.ts --outdir ./dist --target bun

# -----------------------------------------------------------------------------
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM oven/bun:1.3.5-alpine AS production

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy package files
COPY package.json ./
COPY apps/api/package.json ./apps/api/

# Copy source code and generated Prisma client
COPY --from=builder /app/apps/api/src ./apps/api/src

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check for ECS
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start the application
WORKDIR /app/apps/api
CMD ["bun", "run", "src/index.ts"]
