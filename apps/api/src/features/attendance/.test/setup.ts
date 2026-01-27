import { prisma } from "@api/lib/db";
import { resetSequence, StampFactory } from "@api/lib/db/factory";
import { afterEach, beforeEach } from "vitest";

// Clean up database before each test (ensures clean state)
beforeEach(async () => {
  await prisma.stamp.deleteMany();
  resetSequence();
});

// Clean up database after each test
afterEach(async () => {
  await prisma.stamp.deleteMany();
  resetSequence();
});

// Re-export factory for convenience
export { StampFactory };

// Helper to create a date string in YYYY-MM-DD format
export const getDateString = (daysOffset = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split("T")[0] as string;
};

// Alias for stamp tests
export const getTodayDateString = (): string => getDateString(0);
