import {
  responseBadRequest,
  responseDBAccessError,
  responseOk,
  validateJson,
} from "@api/lib/http";
import type { Context } from "hono";
import { Hono } from "hono";
import type { StampError } from "../domain/stamp.ts";
import { stampService } from "../service/stamp-service.ts";
import { stampActionSchema } from "../validator/stamp-validator.ts";

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
  // GET /api/stamps/status - Get current work status
  .get("/status", async (c) => {
    return stampService.getStatus().match(
      (result) => responseOk(c, result),
      (error) => handleStampError(error, c),
    );
  })

  // POST /api/stamps - Record a stamp action
  .post(
    "/",
    validateJson(stampActionSchema, (result, c) => {
      const message = result.error.issues[0]?.message ?? "Invalid action type";
      return responseBadRequest(c, message);
    }),
    async (c) => {
      const { action } = c.req.valid("json");

      const serviceMethod = {
        clock_in: stampService.clockIn,
        clock_out: stampService.clockOut,
        break_start: stampService.breakStart,
        break_end: stampService.breakEnd,
      }[action];

      return serviceMethod().match(
        (stamp) => responseOk(c, { stamp }),
        (error) => handleStampError(error, c),
      );
    },
  );
