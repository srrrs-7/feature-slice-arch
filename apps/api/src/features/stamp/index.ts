// Re-export domain types
export type {
  CurrentStatusResponse,
  Stamp,
  StampError,
  StampId,
  StampType,
  WorkStatus,
} from "./domain/stamp.ts";

// Export route handler
export { default as stampRoutes } from "./handler.ts";
