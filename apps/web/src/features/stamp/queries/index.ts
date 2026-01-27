import {
  createMutation,
  createQuery,
  useQueryClient,
} from "@tanstack/svelte-query";
import { queryKeys } from "$lib/query";
import * as api from "../api";
import type { Stamp, StampAction } from "../types";

/**
 * Query: Fetch current work status
 *
 * Cache: 1 minute (shorter for real-time status)
 * Retry: 3 times with exponential backoff
 * Refetches on window focus
 */
export function createStatusQuery() {
  return createQuery(() => ({
    queryKey: queryKeys.stamps.status(),
    queryFn: () => api.getStatus(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  }));
}

/**
 * Mutation: Record a stamp action (clock_in, clock_out, break_start, break_end)
 *
 * On success: Invalidates status cache to show updated state
 * No retry (to prevent duplicate stamps)
 */
export function createStampMutation() {
  const queryClient = useQueryClient();

  return createMutation<Stamp, Error, StampAction>(() => ({
    mutationFn: async (action: StampAction) => {
      const data = await api.recordStamp(action);
      return data.stamp;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.stamps.status(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.attendance.all(),
      });
    },
  }));
}
