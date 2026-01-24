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
        // Template/example files
        "src/features/.example/**",
        // Unused/incomplete features
        "src/features/auth/**",
        "src/domain/**",
        // Re-export only files
        "src/**/index.ts",
        // Empty placeholder files
        "src/**/domain/domain.ts",
        "src/features/attendance/repository/repository.ts",
        // Middleware (covered by integration tests)
        "src/middleware/**",
        // Config files
        "src/lib/db/prisma.config.ts",
        // Shared utility libraries (not all functions are used)
        "src/lib/http/**",
        "src/lib/error/**",
        "src/lib/logger/**",
        "src/lib/time/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        // Lower threshold for branches due to defensive error handling
        // (exhaustive switch statements with unreachable cases)
        branches: 70,
        statements: 80,
      },
    },
  },
});
