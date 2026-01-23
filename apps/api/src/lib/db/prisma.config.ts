import path from "node:path";
import { defineConfig } from "prisma/config";

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

const databaseUrl = buildDatabaseUrl();

export default defineConfig({
  schema: path.join(__dirname, "prisma/schema.prisma"),
  datasource: {
    url: databaseUrl,
  },
});
