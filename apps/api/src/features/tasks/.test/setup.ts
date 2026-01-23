import { prisma } from "@api/lib/db";
import { resetSequence, TaskFactory } from "@api/lib/db/factory";
import { afterEach } from "vitest";

// Clean up database after each test
afterEach(async () => {
  await prisma.task.deleteMany();
  resetSequence();
});

// Re-export factory for convenience
export { TaskFactory };
