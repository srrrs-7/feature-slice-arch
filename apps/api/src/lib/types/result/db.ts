import { ResultAsync } from "neverthrow";
import { logger } from "../../logger/index.ts";

/**
 * Wraps an async database operation with ResultAsync for functional error handling.
 * @param fn - Async function to execute
 * @param mapError - Function to map the error to the desired error type
 */
export const wrapAsync = <T, E>(
  fn: () => Promise<T>,
  mapError: (error: unknown) => E,
): ResultAsync<T, E> => ResultAsync.fromPromise(fn(), mapError);

/**
 * Wraps an async database operation with ResultAsync and logging.
 * Logs operation name, arguments, duration, and result status.
 *
 * @param name - Operation name (e.g., "taskRepository.findById")
 * @param args - Arguments passed to the operation (for logging)
 * @param fn - Async function to execute
 * @param mapError - Function to map the error to the desired error type
 */
export const wrapAsyncWithLog = <T, E>(
  name: string,
  args: Record<string, unknown>,
  fn: () => Promise<T>,
  mapError: (error: unknown) => E,
): ResultAsync<T, E> => {
  const startTime = performance.now();

  logger.debug({ operation: name, args }, "DB operation started");

  return ResultAsync.fromPromise(fn(), mapError)
    .map((result) => {
      const durationMs = (performance.now() - startTime).toFixed(2);
      logger.debug(
        { operation: name, args, durationMs },
        "DB operation success",
      );
      return result;
    })
    .mapErr((error) => {
      const durationMs = (performance.now() - startTime).toFixed(2);
      logger.error(
        { operation: name, args, durationMs, error },
        "DB operation failed",
      );
      return error;
    });
};
