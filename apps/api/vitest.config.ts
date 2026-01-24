import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false, // Run test files sequentially
    silent: false, // Keep test output visible
    hideSkippedTests: true,
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent", // Suppress all logs during tests
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/.test/**",
        "src/lib/db/generated/**",
        "src/lib/db/prisma/migrations/**",
        "src/index.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
