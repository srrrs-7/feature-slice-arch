import { derived, writable } from "svelte/store";
import * as api from "../api";
import type { AttendanceRecord, AttendanceSummary } from "../types";

// State stores
export const records = writable<AttendanceRecord[]>([]);
export const summary = writable<AttendanceSummary | null>(null);
export const selectedRecord = writable<AttendanceRecord | null>(null);
export const isLoading = writable<boolean>(false);
export const error = writable<string | null>(null);

// Selected year and month for list view
export const selectedYear = writable<number>(new Date().getFullYear());
export const selectedMonth = writable<number>(new Date().getMonth() + 1);

// Derived: date range for API query
export const dateRange = derived(
  [selectedYear, selectedMonth],
  ([$year, $month]) => {
    const from = `${$year}-${String($month).padStart(2, "0")}-01`;
    const lastDay = new Date($year, $month, 0).getDate();
    const to = `${$year}-${String($month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { from, to };
  },
);

// Store actions
export const attendanceStore = {
  /**
   * Fetch attendance records for date range
   */
  async fetchByDateRange(from: string, to: string): Promise<void> {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.getAttendanceByDateRange(from, to);
      records.set(data.records);
      summary.set(data.summary);
    } catch (err) {
      error.set(
        err instanceof Error ? err.message : "Failed to fetch attendance",
      );
    } finally {
      isLoading.set(false);
    }
  },

  /**
   * Fetch attendance record for specific date
   */
  async fetchByDate(date: string): Promise<void> {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.getAttendanceByDate(date);
      selectedRecord.set(data.record);
    } catch (err) {
      error.set(
        err instanceof Error ? err.message : "Failed to fetch attendance",
      );
    } finally {
      isLoading.set(false);
    }
  },

  /**
   * Navigate to previous month
   */
  prevMonth(): void {
    selectedMonth.update((m) => {
      if (m === 1) {
        selectedYear.update((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  },

  /**
   * Navigate to next month
   */
  nextMonth(): void {
    selectedMonth.update((m) => {
      if (m === 12) {
        selectedYear.update((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  },

  /**
   * Navigate to current month
   */
  goToThisMonth(): void {
    const now = new Date();
    selectedYear.set(now.getFullYear());
    selectedMonth.set(now.getMonth() + 1);
  },

  /**
   * Clear all store state
   */
  clear(): void {
    records.set([]);
    summary.set(null);
    selectedRecord.set(null);
    error.set(null);
    isLoading.set(false);
  },
};
