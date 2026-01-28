import { prisma } from "@api/lib/db";
import { FileFactory, resetSequence } from "@api/lib/db/factory";
import { afterEach } from "vitest";

afterEach(async () => {
  await prisma.file.deleteMany();
  resetSequence();
});

export { FileFactory };
