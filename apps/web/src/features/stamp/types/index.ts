// Re-export API types (ID and enum types only)
export type {
  StampId,
  StampType,
  WorkStatus,
} from "@api/features/stamp/domain/stamp";

// Client-side types (JSON serialized - dates are strings)
export interface Stamp {
  readonly id: string;
  readonly date: string;
  readonly clockInAt: string;
  readonly clockOutAt: string | null;
  readonly breakStartAt: string | null;
  readonly breakEndAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CurrentStatusResponse {
  readonly status: import("@api/features/stamp/domain/stamp").WorkStatus;
  readonly stamp: Stamp | null;
}

// Client-side type alias
export type StampAction =
  | "clock_in"
  | "clock_out"
  | "break_start"
  | "break_end";
