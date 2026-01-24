import type { Stamp as PrismaStamp } from "@api/lib/db";
import { prisma, wrapAsyncWithLog } from "@api/lib/db";
import type { ResultAsync } from "neverthrow";
import {
  createStamp,
  createStampId,
  type Stamp,
  type StampError,
  StampErrors,
  type StampId,
} from "../domain/stamp.ts";

// Mapper: Prisma model -> Domain model
const toDomain = (prismaStamp: PrismaStamp): Stamp =>
  createStamp({
    id: createStampId(prismaStamp.id),
    date: prismaStamp.date,
    clockInAt: prismaStamp.clockInAt,
    clockOutAt: prismaStamp.clockOutAt,
    breakStartAt: prismaStamp.breakStartAt,
    breakEndAt: prismaStamp.breakEndAt,
    createdAt: prismaStamp.createdAt,
    updatedAt: prismaStamp.updatedAt,
  });

// Repository functions returning ResultAsync types

const findByDate = (date: string): ResultAsync<Stamp | null, StampError> =>
  wrapAsyncWithLog(
    "stampRepository.findByDate",
    { date },
    () => prisma.stamp.findUnique({ where: { date } }),
    StampErrors.database,
  ).map((stamp) => (stamp ? toDomain(stamp) : null));

const create = (params: {
  readonly date: string;
  readonly clockInAt: Date;
}): ResultAsync<Stamp, StampError> =>
  wrapAsyncWithLog(
    "stampRepository.create",
    { date: params.date },
    () =>
      prisma.stamp.create({
        data: {
          date: params.date,
          clockInAt: params.clockInAt,
          clockOutAt: null,
          breakStartAt: null,
          breakEndAt: null,
        },
      }),
    StampErrors.database,
  ).map(toDomain);

const updateClockOut = (
  id: StampId,
  clockOutAt: Date,
): ResultAsync<Stamp, StampError> =>
  wrapAsyncWithLog(
    "stampRepository.updateClockOut",
    { id, clockOutAt },
    () =>
      prisma.stamp.update({
        where: { id: id as string },
        data: { clockOutAt },
      }),
    StampErrors.database,
  ).map(toDomain);

const updateBreakStart = (
  id: StampId,
  breakStartAt: Date,
): ResultAsync<Stamp, StampError> =>
  wrapAsyncWithLog(
    "stampRepository.updateBreakStart",
    { id, breakStartAt },
    () =>
      prisma.stamp.update({
        where: { id: id as string },
        data: { breakStartAt },
      }),
    StampErrors.database,
  ).map(toDomain);

const updateBreakEnd = (
  id: StampId,
  breakEndAt: Date,
): ResultAsync<Stamp, StampError> =>
  wrapAsyncWithLog(
    "stampRepository.updateBreakEnd",
    { id, breakEndAt },
    () =>
      prisma.stamp.update({
        where: { id: id as string },
        data: { breakEndAt },
      }),
    StampErrors.database,
  ).map(toDomain);

// Repository as a namespace
export const stampRepository = {
  findByDate,
  create,
  updateClockOut,
  updateBreakStart,
  updateBreakEnd,
} as const;
