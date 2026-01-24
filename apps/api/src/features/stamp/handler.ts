import {
  responseBadRequest,
  responseCreated,
  responseDBAccessError,
  responseOk,
} from "@api/lib/http";
import type { Context } from "hono";
import { Hono } from "hono";
import type { StampError } from "./domain/stamp.ts";
import { stampService } from "./service/service.ts";

// Helper to handle stamp errors
const handleStampError = (error: StampError, c: Context) => {
  switch (error.type) {
    case "ALREADY_CLOCKED_IN":
      return responseBadRequest(c, `Already clocked in for ${error.date}`);
    case "ALREADY_CLOCKED_OUT":
      return responseBadRequest(c, `Already clocked out for ${error.date}`);
    case "ALREADY_ON_BREAK":
      return responseBadRequest(c, `Already on break for ${error.date}`);
    case "NOT_CLOCKED_IN":
      return responseBadRequest(c, `Not clocked in for ${error.date}`);
    case "NOT_ON_BREAK":
      return responseBadRequest(c, `Not on break for ${error.date}`);
    case "STILL_ON_BREAK":
      return responseBadRequest(
        c,
        `Still on break for ${error.date}. End break first.`,
      );
    case "STAMP_NOT_FOUND":
      return responseBadRequest(c, `No stamp record for ${error.date}`);
    case "VALIDATION_ERROR":
      return responseBadRequest(c, error.message);
    case "DATABASE_ERROR":
      return responseDBAccessError(c);
    default:
      return responseDBAccessError(c, { message: "Unexpected error" });
  }
};

export default new Hono()
  // GET /api/stamps/current - Get current work status
  .get("/current", async (c) => {
    return stampService.getCurrentStatus().match(
      (result) => responseOk(c, result),
      (error) => handleStampError(error, c),
    );
  })

  // POST /api/stamps/clock-in - Clock in
  .post("/clock-in", async (c) => {
    return stampService.clockIn().match(
      (stamp) => responseCreated(c, { stamp }),
      (error) => handleStampError(error, c),
    );
  })

  // PUT /api/stamps/clock-out - Clock out
  .put("/clock-out", async (c) => {
    return stampService.clockOut().match(
      (stamp) => responseOk(c, { stamp }),
      (error) => handleStampError(error, c),
    );
  })

  // PUT /api/stamps/break-start - Start break
  .put("/break-start", async (c) => {
    return stampService.breakStart().match(
      (stamp) => responseOk(c, { stamp }),
      (error) => handleStampError(error, c),
    );
  })

  // PUT /api/stamps/break-end - End break
  .put("/break-end", async (c) => {
    return stampService.breakEnd().match(
      (stamp) => responseOk(c, { stamp }),
      (error) => handleStampError(error, c),
    );
  });
