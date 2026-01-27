/**
 * Query Key Factory
 *
 * Centralized query key management for cache invalidation and prefetching.
 * Uses a hierarchical structure for granular cache control.
 */

export const queryKeys = {
  // Tasks
  tasks: {
    all: () => ["tasks"] as const,
    lists: () => [...queryKeys.tasks.all(), "list"] as const,
    list: (filters?: { status?: string }) =>
      [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all(), "detail"] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
  },

  // Stamps (time tracking)
  stamps: {
    all: () => ["stamps"] as const,
    status: () => [...queryKeys.stamps.all(), "status"] as const,
  },

  // Attendance
  attendance: {
    all: () => ["attendance"] as const,
    lists: () => [...queryKeys.attendance.all(), "list"] as const,
    list: (params: { from: string; to: string }) =>
      [...queryKeys.attendance.lists(), params] as const,
    details: () => [...queryKeys.attendance.all(), "detail"] as const,
    detail: (date: string) =>
      [...queryKeys.attendance.details(), date] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
