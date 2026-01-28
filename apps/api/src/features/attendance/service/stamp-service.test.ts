import { dayjs } from "@api/lib/time";
import { errAsync, okAsync, type ResultAsync } from "neverthrow";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";
import {
  createStamp,
  createStampId,
  getWorkStatus,
  type Stamp,
  type StampError,
  StampErrors,
  type StampId,
} from "../domain/stamp.ts";

// Mock helper to create a valid Stamp
function createMockStamp(overrides: Partial<Stamp> = {}): Stamp {
  const now = dayjs();
  return createStamp({
    id: createStampId("stamp-1"),
    date: "2025-01-24",
    clockInAt: now.toDate(),
    clockOutAt: null,
    breakStartAt: null,
    breakEndAt: null,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
    ...overrides,
  });
}

// Type-safe mock functions
type MockFn<T extends (...args: never[]) => unknown> = Mock<T>;

const mockRepository: {
  findByDate: MockFn<(date: string) => ResultAsync<Stamp | null, StampError>>;
  create: MockFn<
    (params: {
      date: string;
      clockInAt: Date;
    }) => ResultAsync<Stamp, StampError>
  >;
  updateClockOut: MockFn<
    (id: StampId, clockOutAt: Date) => ResultAsync<Stamp, StampError>
  >;
  updateBreakStart: MockFn<
    (id: StampId, breakStartAt: Date) => ResultAsync<Stamp, StampError>
  >;
  updateBreakEnd: MockFn<
    (id: StampId, breakEndAt: Date) => ResultAsync<Stamp, StampError>
  >;
} = {
  findByDate: vi.fn(() => okAsync(null)),
  create: vi.fn(() => okAsync(createMockStamp())),
  updateClockOut: vi.fn(() =>
    okAsync(createMockStamp({ clockOutAt: dayjs().toDate() })),
  ),
  updateBreakStart: vi.fn(() =>
    okAsync(createMockStamp({ breakStartAt: dayjs().toDate() })),
  ),
  updateBreakEnd: vi.fn(() =>
    okAsync(
      createMockStamp({
        breakStartAt: dayjs().toDate(),
        breakEndAt: dayjs().toDate(),
      }),
    ),
  ),
};

// Mock the repository module
vi.mock("../repository/stamp-repository.ts", () => ({
  stampRepository: mockRepository,
}));

// Import service after mocking
const { stampService } = await import("./stamp-service.ts");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("stampService.getStatus", () => {
  test("returns not_working when no stamp exists", async () => {
    mockRepository.findByDate.mockReturnValue(okAsync(null));

    const result = await stampService.getStatus();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.status).toBe("not_working");
      expect(result.value.stamp).toBeNull();
    }
  });

  test("returns working when clocked in", async () => {
    const stamp = createMockStamp();
    mockRepository.findByDate.mockReturnValue(okAsync(stamp));

    const result = await stampService.getStatus();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.status).toBe("working");
      expect(result.value.stamp).not.toBeNull();
    }
  });

  test("returns on_break when on break", async () => {
    const stamp = createMockStamp({
      breakStartAt: dayjs().toDate(),
      breakEndAt: null,
    });
    mockRepository.findByDate.mockReturnValue(okAsync(stamp));

    const result = await stampService.getStatus();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.status).toBe("on_break");
    }
  });

  test("returns clocked_out when clocked out", async () => {
    const stamp = createMockStamp({
      clockOutAt: dayjs().toDate(),
    });
    mockRepository.findByDate.mockReturnValue(okAsync(stamp));

    const result = await stampService.getStatus();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.status).toBe("clocked_out");
    }
  });

  test("returns database error on repository failure", async () => {
    mockRepository.findByDate.mockReturnValue(
      errAsync(StampErrors.database("Connection failed")),
    );

    const result = await stampService.getStatus();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("DATABASE_ERROR");
    }
  });
});

describe("stampService.clockIn", () => {
  test("creates stamp when no existing stamp", async () => {
    const newStamp = createMockStamp();
    mockRepository.findByDate.mockReturnValue(okAsync(null));
    mockRepository.create.mockReturnValue(okAsync(newStamp));

    const result = await stampService.clockIn();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.id).toBe(newStamp.id);
    }
    expect(mockRepository.create).toHaveBeenCalled();
  });

  test("returns ALREADY_CLOCKED_IN when stamp exists", async () => {
    const existingStamp = createMockStamp();
    mockRepository.findByDate.mockReturnValue(okAsync(existingStamp));

    const result = await stampService.clockIn();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("ALREADY_CLOCKED_IN");
    }
    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  test("returns database error on repository failure", async () => {
    mockRepository.findByDate.mockReturnValue(
      errAsync(StampErrors.database("Connection failed")),
    );

    const result = await stampService.clockIn();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("DATABASE_ERROR");
    }
  });
});

describe("stampService.clockOut", () => {
  test("updates stamp with clock-out time", async () => {
    const existingStamp = createMockStamp();
    const updatedStamp = createMockStamp({ clockOutAt: dayjs().toDate() });
    mockRepository.findByDate.mockReturnValue(okAsync(existingStamp));
    mockRepository.updateClockOut.mockReturnValue(okAsync(updatedStamp));

    const result = await stampService.clockOut();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.clockOutAt).not.toBeNull();
    }
    expect(mockRepository.updateClockOut).toHaveBeenCalled();
  });

  test("returns NOT_CLOCKED_IN when no stamp exists", async () => {
    mockRepository.findByDate.mockReturnValue(okAsync(null));

    const result = await stampService.clockOut();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("NOT_CLOCKED_IN");
    }
  });

  test("returns ALREADY_CLOCKED_OUT when already clocked out", async () => {
    const existingStamp = createMockStamp({ clockOutAt: dayjs().toDate() });
    mockRepository.findByDate.mockReturnValue(okAsync(existingStamp));

    const result = await stampService.clockOut();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("ALREADY_CLOCKED_OUT");
    }
  });

  test("returns STILL_ON_BREAK when on break", async () => {
    const existingStamp = createMockStamp({
      breakStartAt: dayjs().toDate(),
      breakEndAt: null,
    });
    mockRepository.findByDate.mockReturnValue(okAsync(existingStamp));

    const result = await stampService.clockOut();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("STILL_ON_BREAK");
    }
  });
});

describe("stampService.breakStart", () => {
  test("updates stamp with break-start time", async () => {
    const existingStamp = createMockStamp();
    const updatedStamp = createMockStamp({ breakStartAt: dayjs().toDate() });
    mockRepository.findByDate.mockReturnValue(okAsync(existingStamp));
    mockRepository.updateBreakStart.mockReturnValue(okAsync(updatedStamp));

    const result = await stampService.breakStart();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.breakStartAt).not.toBeNull();
    }
    expect(mockRepository.updateBreakStart).toHaveBeenCalled();
  });

  test("returns NOT_CLOCKED_IN when no stamp exists", async () => {
    mockRepository.findByDate.mockReturnValue(okAsync(null));

    const result = await stampService.breakStart();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("NOT_CLOCKED_IN");
    }
  });

  test("returns ALREADY_CLOCKED_OUT when already clocked out", async () => {
    const existingStamp = createMockStamp({ clockOutAt: dayjs().toDate() });
    mockRepository.findByDate.mockReturnValue(okAsync(existingStamp));

    const result = await stampService.breakStart();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("ALREADY_CLOCKED_OUT");
    }
  });

  test("returns ALREADY_ON_BREAK when already on break", async () => {
    const existingStamp = createMockStamp({
      breakStartAt: dayjs().toDate(),
      breakEndAt: null,
    });
    mockRepository.findByDate.mockReturnValue(okAsync(existingStamp));

    const result = await stampService.breakStart();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("ALREADY_ON_BREAK");
    }
  });

  test("allows starting break after previous break ended", async () => {
    const now = dayjs();
    const existingStamp = createMockStamp({
      breakStartAt: now.subtract(60, "minute").toDate(),
      breakEndAt: now.subtract(30, "minute").toDate(),
    });
    const updatedStamp = createMockStamp({ breakStartAt: now.toDate() });
    mockRepository.findByDate.mockReturnValue(okAsync(existingStamp));
    mockRepository.updateBreakStart.mockReturnValue(okAsync(updatedStamp));

    const result = await stampService.breakStart();

    expect(result.isOk()).toBe(true);
    expect(mockRepository.updateBreakStart).toHaveBeenCalled();
  });
});

describe("stampService.breakEnd", () => {
  test("updates stamp with break-end time", async () => {
    const existingStamp = createMockStamp({
      breakStartAt: dayjs().toDate(),
      breakEndAt: null,
    });
    const updatedStamp = createMockStamp({
      breakStartAt: dayjs().toDate(),
      breakEndAt: dayjs().toDate(),
    });
    mockRepository.findByDate.mockReturnValue(okAsync(existingStamp));
    mockRepository.updateBreakEnd.mockReturnValue(okAsync(updatedStamp));

    const result = await stampService.breakEnd();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.breakEndAt).not.toBeNull();
    }
    expect(mockRepository.updateBreakEnd).toHaveBeenCalled();
  });

  test("returns NOT_CLOCKED_IN when no stamp exists", async () => {
    mockRepository.findByDate.mockReturnValue(okAsync(null));

    const result = await stampService.breakEnd();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("NOT_CLOCKED_IN");
    }
  });

  test("returns NOT_ON_BREAK when not on break (no break started)", async () => {
    const existingStamp = createMockStamp({
      breakStartAt: null,
      breakEndAt: null,
    });
    mockRepository.findByDate.mockReturnValue(okAsync(existingStamp));

    const result = await stampService.breakEnd();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("NOT_ON_BREAK");
    }
  });

  test("returns NOT_ON_BREAK when break already ended", async () => {
    const now = dayjs();
    const existingStamp = createMockStamp({
      breakStartAt: now.subtract(60, "minute").toDate(),
      breakEndAt: now.subtract(30, "minute").toDate(),
    });
    mockRepository.findByDate.mockReturnValue(okAsync(existingStamp));

    const result = await stampService.breakEnd();

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("NOT_ON_BREAK");
    }
  });
});

describe("getWorkStatus helper", () => {
  test("returns not_working for null stamp", () => {
    expect(getWorkStatus(null)).toBe("not_working");
  });

  test("returns working for clocked in stamp", () => {
    const stamp = createMockStamp();
    expect(getWorkStatus(stamp)).toBe("working");
  });

  test("returns on_break for stamp on break", () => {
    const stamp = createMockStamp({
      breakStartAt: dayjs().toDate(),
      breakEndAt: null,
    });
    expect(getWorkStatus(stamp)).toBe("on_break");
  });

  test("returns clocked_out for clocked out stamp", () => {
    const stamp = createMockStamp({
      clockOutAt: dayjs().toDate(),
    });
    expect(getWorkStatus(stamp)).toBe("clocked_out");
  });

  test("returns working for stamp with completed break", () => {
    const now = dayjs();
    const stamp = createMockStamp({
      breakStartAt: now.subtract(60, "minute").toDate(),
      breakEndAt: now.subtract(30, "minute").toDate(),
    });
    expect(getWorkStatus(stamp)).toBe("working");
  });
});
