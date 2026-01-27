import { QueryClient } from "@tanstack/svelte-query";

/**
 * Default stale time for queries (5 minutes)
 * Data is considered fresh for this duration
 */
const DEFAULT_STALE_TIME = 5 * 60 * 1000;

/**
 * Default garbage collection time (30 minutes)
 * Unused cache entries are removed after this duration
 */
const DEFAULT_GC_TIME = 30 * 60 * 1000;

/**
 * Create and configure the QueryClient with optimal defaults
 *
 * Cache Strategy:
 * - staleTime: 5 minutes - queries won't refetch if data is younger
 * - gcTime: 30 minutes - unused data stays in cache for potential reuse
 *
 * Retry Strategy:
 * - 3 retries for failed queries with exponential backoff
 * - No retries for mutations (to prevent duplicate submissions)
 *
 * Refetch Strategy:
 * - Refetch on window focus (user returns to tab)
 * - Refetch on reconnect (network comes back)
 * - No automatic refetch on mount if data is fresh
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache settings
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_GC_TIME,

        // Retry settings with exponential backoff
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch settings
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,

        // Network mode
        networkMode: "online",
      },
      mutations: {
        // No retries for mutations to prevent duplicate submissions
        retry: false,

        // Network mode
        networkMode: "online",
      },
    },
  });
}

/**
 * Singleton QueryClient instance
 */
let queryClient: QueryClient | null = null;

/**
 * Get or create the singleton QueryClient
 */
export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
}
