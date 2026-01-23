import { ResultAsync } from "neverthrow";

/**
 * Wraps an async database operation with ResultAsync for functional error handling.
 * @param fn - Async function to execute
 * @param mapError - Function to map the error to the desired error type
 */
export const wrapAsync = <T, E>(
  fn: () => Promise<T>,
  mapError: (error: unknown) => E,
): ResultAsync<T, E> => ResultAsync.fromPromise(fn(), mapError);
