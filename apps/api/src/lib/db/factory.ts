import { dayjs } from "@api/lib/time";
import {
  defineFileFactory,
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
    const today = dayjs();
    const dateStr = today.format("YYYY-MM-DD");
    return {
      date: `${dateStr}-${seq}`, // Make unique for each test
      clockInAt: today.toDate(),
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
        breakStartAt: dayjs().toDate(),
        breakEndAt: null,
      }),
    },
    clockedOut: {
      data: async () => ({
        clockOutAt: dayjs().toDate(),
        breakStartAt: null,
        breakEndAt: null,
      }),
    },
    withBreak: {
      data: async () => {
        const now = dayjs();
        const breakStart = now.subtract(60, "minute").toDate(); // 1 hour ago
        const breakEnd = now.subtract(30, "minute").toDate(); // 30 min ago
        return {
          clockOutAt: null,
          breakStartAt: breakStart,
          breakEndAt: breakEnd,
        };
      },
    },
  },
});

// File factory with default values
export const FileFactory = defineFileFactory({
  defaultData: async ({ seq }) => {
    const expiresAt = dayjs().add(180, "second").toDate(); // 3 minutes from now
    return {
      fileName: `file-${seq}.png`,
      contentType: "image/png",
      fileSize: null,
      s3Key: `uploads/test-${seq}/file-${seq}.png`,
      status: "pending",
      expiresAt,
    };
  },
  traits: {
    uploaded: {
      data: {
        status: "uploaded",
        fileSize: 1024,
      },
    },
    failed: {
      data: {
        status: "failed",
      },
    },
    expired: {
      data: async () => ({
        status: "pending",
        expiresAt: dayjs().subtract(1, "second").toDate(), // Already expired
      }),
    },
  },
});

// Re-export utilities
export { resetSequence } from "./generated/fabbrica";
