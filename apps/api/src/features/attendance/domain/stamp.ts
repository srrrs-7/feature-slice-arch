import {
  type DatabaseError,
  Errors,
  type ValidationError,
} from "@api/lib/error";

// Stamp entity types (immutable)

export type StampId = string & { readonly _brand: unique symbol };

export type WorkStatus = "not_working" | "working" | "on_break" | "clocked_out";

export type StampType = "clock_in" | "clock_out" | "break_start" | "break_end";

export interface Stamp {
  readonly id: StampId;
  readonly date: string; // YYYY-MM-DD format
  readonly clockInAt: Date;
  readonly clockOutAt: Date | null;
  readonly breakStartAt: Date | null;
  readonly breakEndAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Current status response
export interface CurrentStatusResponse {
  readonly status: WorkStatus;
  readonly stamp: Stamp | null;
}

// Domain-specific error types
export type StampNotFoundError = {
  readonly type: "STAMP_NOT_FOUND";
  readonly date: string;
};

export type AlreadyClockedInError = {
  readonly type: "ALREADY_CLOCKED_IN";
  readonly date: string;
};

export type AlreadyClockedOutError = {
  readonly type: "ALREADY_CLOCKED_OUT";
  readonly date: string;
};

export type AlreadyOnBreakError = {
  readonly type: "ALREADY_ON_BREAK";
  readonly date: string;
};

export type NotClockedInError = {
  readonly type: "NOT_CLOCKED_IN";
  readonly date: string;
};

export type NotOnBreakError = {
  readonly type: "NOT_ON_BREAK";
  readonly date: string;
};

export type StillOnBreakError = {
  readonly type: "STILL_ON_BREAK";
  readonly date: string;
};

// Combined error type (common + domain-specific)
export type StampError =
  | DatabaseError
  | ValidationError
  | StampNotFoundError
  | AlreadyClockedInError
  | AlreadyClockedOutError
  | AlreadyOnBreakError
  | NotClockedInError
  | NotOnBreakError
  | StillOnBreakError;

// Smart constructors
export const createStampId = (id: string): StampId => id as StampId;

export const createStamp = (params: {
  id: StampId;
  date: string;
  clockInAt: Date;
  clockOutAt: Date | null;
  breakStartAt: Date | null;
  breakEndAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Stamp => Object.freeze(params);

// Helper to determine work status from stamp
export const getWorkStatus = (stamp: Stamp | null): WorkStatus => {
  if (stamp === null) {
    return "not_working";
  }
  if (stamp.clockOutAt !== null) {
    return "clocked_out";
  }
  if (stamp.breakStartAt !== null && stamp.breakEndAt === null) {
    return "on_break";
  }
  return "working";
};

// Error constructors (using common errors + domain-specific)
export const StampErrors = {
  notFound: (date: string): StampNotFoundError => ({
    type: "STAMP_NOT_FOUND",
    date,
  }),
  alreadyClockedIn: (date: string): AlreadyClockedInError => ({
    type: "ALREADY_CLOCKED_IN",
    date,
  }),
  alreadyClockedOut: (date: string): AlreadyClockedOutError => ({
    type: "ALREADY_CLOCKED_OUT",
    date,
  }),
  alreadyOnBreak: (date: string): AlreadyOnBreakError => ({
    type: "ALREADY_ON_BREAK",
    date,
  }),
  notClockedIn: (date: string): NotClockedInError => ({
    type: "NOT_CLOCKED_IN",
    date,
  }),
  notOnBreak: (date: string): NotOnBreakError => ({
    type: "NOT_ON_BREAK",
    date,
  }),
  stillOnBreak: (date: string): StillOnBreakError => ({
    type: "STILL_ON_BREAK",
    date,
  }),
  validation: Errors.validation,
  database: Errors.database,
} as const;
