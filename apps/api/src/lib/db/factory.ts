import {
  defineStampFactory,
  defineTaskFactory,
  initialize,
} from "./generated/fabbrica";
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

// Stamp factory with default values
export const StampFactory = defineStampFactory({
  defaultData: async ({ seq }) => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    return {
      date: `${dateStr}-${seq}`, // Make unique for each test
      clockInAt: today,
      clockOutAt: null,
      breakStartAt: null,
      breakEndAt: null,
    };
  },
  traits: {
    working: {
      data: {
        clockOutAt: null,
        breakStartAt: null,
        breakEndAt: null,
      },
    },
    onBreak: {
      data: async () => ({
        clockOutAt: null,
        breakStartAt: new Date(),
        breakEndAt: null,
      }),
    },
    clockedOut: {
      data: async () => ({
        clockOutAt: new Date(),
        breakStartAt: null,
        breakEndAt: null,
      }),
    },
    withBreak: {
      data: async () => {
        const now = new Date();
        const breakStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
        const breakEnd = new Date(now.getTime() - 30 * 60 * 1000); // 30 min ago
        return {
          clockOutAt: null,
          breakStartAt: breakStart,
          breakEndAt: breakEnd,
        };
      },
    },
  },
});

// Re-export utilities
export { resetSequence } from "./generated/fabbrica";
