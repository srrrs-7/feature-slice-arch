import type { CurrentStatusResponse, Stamp, StampAction } from "../types";
import { stampsApi } from "./client";

/**
 * Get current work status
 */
export async function getStatus(): Promise<CurrentStatusResponse> {
  const res = await stampsApi.status.$get();
  if (!res.ok) throw new Error(`Failed to fetch status: ${res.statusText}`);
  return await res.json();
}

/**
 * Record a stamp action (clock_in, clock_out, break_start, break_end)
 */
export async function recordStamp(
  action: StampAction,
): Promise<{ stamp: Stamp }> {
  const res = await stampsApi.$post({ json: { action } });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }));
    const message =
      "message" in data ? (data.message as string) : res.statusText;
    throw new Error(message);
  }
  return await res.json();
}
