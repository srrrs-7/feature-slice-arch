import { createQuery } from "@tanstack/svelte-query";
import { queryKeys } from "$lib/query";
import * as api from "../api";

/**
 * Query: Fetch attendance records for a date range
 *
 * Cache: 5 minutes (default staleTime)
 * Retry: 3 times with exponential backoff
 */
export function createAttendanceListQuery(
  params: () => { from: string; to: string },
) {
  return createQuery(() => ({
    queryKey: queryKeys.attendance.list(params()),
    queryFn: () => api.getAttendanceByDateRange(params().from, params().to),
    enabled: !!params().from && !!params().to,
  }));
}

/**
 * Query: Fetch attendance record for a specific date
 *
 * Cache: 5 minutes (default staleTime)
 * Retry: 3 times with exponential backoff
 */
export function createAttendanceDetailQuery(date: () => string) {
  return createQuery(() => ({
    queryKey: queryKeys.attendance.detail(date()),
    queryFn: () => api.getAttendanceByDate(date()),
    enabled: !!date(),
  }));
}
