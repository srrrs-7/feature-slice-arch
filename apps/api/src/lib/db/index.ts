import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./generated/client";

// Build DATABASE_URL from environment variables
const buildDatabaseUrl = (): string => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST ?? "localhost";
  const port = process.env.DB_PORT ?? "5432";
  const dbname = process.env.DB_DBNAME ?? "mydb";
  const username = process.env.DB_USERNAME ?? "postgres";
  const password = process.env.DB_PASSWORD ?? "postgres";

  return `postgresql://${username}:${password}@${host}:${port}/${dbname}`;
};

// Create PostgreSQL connection pool
const pool = new Pool({ connectionString: buildDatabaseUrl() });
const adapter = new PrismaPg(pool);

// Singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "test"
        ? []
        : process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient };
export { wrapAsync, wrapAsyncWithLog } from "../types/result/db.ts";
export * from "./generated/client";
