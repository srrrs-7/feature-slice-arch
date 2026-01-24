import { formatInTimezone, nowUTC } from "@api/lib/time";
import { errAsync, type ResultAsync } from "neverthrow";
import {
  type CurrentStatusResponse,
  getWorkStatus,
  type Stamp,
  type StampError,
  StampErrors,
} from "../domain/stamp.ts";
import { stampRepository } from "../repository/repository.ts";

// Helper to get today's date string in Asia/Tokyo timezone
const getTodayDateString = (): string =>
  formatInTimezone(new Date(), "YYYY-MM-DD");

// Get current work status for today
export const getStatus = (): ResultAsync<CurrentStatusResponse, StampError> => {
  const today = getTodayDateString();
  return stampRepository.findByDate(today).map((stamp) => ({
    status: getWorkStatus(stamp),
    stamp,
  }));
};

// Clock in (start work)
export const clockIn = (): ResultAsync<Stamp, StampError> => {
  const today = getTodayDateString();
  const now = nowUTC();

  return stampRepository.findByDate(today).andThen((existingStamp) => {
    if (existingStamp !== null) {
      return errAsync(StampErrors.alreadyClockedIn(today));
    }
    return stampRepository.create({ date: today, clockInAt: now });
  });
};

// Clock out (end work)
export const clockOut = (): ResultAsync<Stamp, StampError> => {
  const today = getTodayDateString();
  const now = nowUTC();

  return stampRepository.findByDate(today).andThen((stamp) => {
    if (stamp === null) {
      return errAsync(StampErrors.notClockedIn(today));
    }
    if (stamp.clockOutAt !== null) {
      return errAsync(StampErrors.alreadyClockedOut(today));
    }
    // Check if still on break
    if (stamp.breakStartAt !== null && stamp.breakEndAt === null) {
      return errAsync(StampErrors.stillOnBreak(today));
    }
    return stampRepository.updateClockOut(stamp.id, now);
  });
};

// Start break
export const breakStart = (): ResultAsync<Stamp, StampError> => {
  const today = getTodayDateString();
  const now = nowUTC();

  return stampRepository.findByDate(today).andThen((stamp) => {
    if (stamp === null) {
      return errAsync(StampErrors.notClockedIn(today));
    }
    if (stamp.clockOutAt !== null) {
      return errAsync(StampErrors.alreadyClockedOut(today));
    }
    if (stamp.breakStartAt !== null && stamp.breakEndAt === null) {
      return errAsync(StampErrors.alreadyOnBreak(today));
    }
    return stampRepository.updateBreakStart(stamp.id, now);
  });
};

// End break
export const breakEnd = (): ResultAsync<Stamp, StampError> => {
  const today = getTodayDateString();
  const now = nowUTC();

  return stampRepository.findByDate(today).andThen((stamp) => {
    if (stamp === null) {
      return errAsync(StampErrors.notClockedIn(today));
    }
    // Check if on break (breakStartAt is set but breakEndAt is null)
    if (stamp.breakStartAt === null || stamp.breakEndAt !== null) {
      return errAsync(StampErrors.notOnBreak(today));
    }
    return stampRepository.updateBreakEnd(stamp.id, now);
  });
};

// Service as a namespace
export const stampService = {
  getStatus,
  clockIn,
  clockOut,
  breakStart,
  breakEnd,
} as const;
