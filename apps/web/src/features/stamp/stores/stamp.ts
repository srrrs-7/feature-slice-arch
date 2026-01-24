import { writable } from "svelte/store";
import * as api from "../api";
import type { Stamp, WorkStatus } from "../types";

// Store state
export const currentStatus = writable<WorkStatus>("not_working");
export const currentStamp = writable<Stamp | null>(null);
export const isLoading = writable<boolean>(false);
export const error = writable<string | null>(null);

// Store actions
export const stampStore = {
  /**
   * Fetch current work status from API
   */
  async fetchStatus(): Promise<void> {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.getStatus();
      currentStatus.set(data.status);
      currentStamp.set(data.stamp);
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      isLoading.set(false);
    }
  },

  /**
   * Clock in (start working)
   */
  async clockIn(): Promise<void> {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.recordStamp("clock_in");
      currentStamp.set(data.stamp);
      currentStatus.set("working");
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to clock in");
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  /**
   * Clock out (end working)
   */
  async clockOut(): Promise<void> {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.recordStamp("clock_out");
      currentStamp.set(data.stamp);
      currentStatus.set("clocked_out");
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to clock out");
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  /**
   * Start break
   */
  async breakStart(): Promise<void> {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.recordStamp("break_start");
      currentStamp.set(data.stamp);
      currentStatus.set("on_break");
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to start break");
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  /**
   * End break
   */
  async breakEnd(): Promise<void> {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.recordStamp("break_end");
      currentStamp.set(data.stamp);
      currentStatus.set("working");
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to end break");
      throw err;
    } finally {
      isLoading.set(false);
    }
  },

  /**
   * Clear store state
   */
  clear(): void {
    currentStatus.set("not_working");
    currentStamp.set(null);
    error.set(null);
    isLoading.set(false);
  },
};
