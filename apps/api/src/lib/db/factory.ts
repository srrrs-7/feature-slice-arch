import { defineTaskFactory, initialize } from "./generated/fabbrica";
import { prisma } from "./index.ts";

// Initialize fabbrica with Prisma client
initialize({ prisma });

// Task factory with default values
export const TaskFactory = defineTaskFactory({
  defaultData: async ({ seq }) => ({
    title: `Task ${seq}`,
    description: `Description for task ${seq}`,
    status: "pending",
  }),
  traits: {
    inProgress: {
      data: {
        status: "in_progress",
      },
    },
    completed: {
      data: {
        status: "completed",
      },
    },
    withoutDescription: {
      data: {
        description: null,
      },
    },
  },
});

// Re-export utilities
export { resetSequence } from "./generated/fabbrica";
