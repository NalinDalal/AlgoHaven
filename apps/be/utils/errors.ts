/**
 * Generic error helpers.
 */

/**
 * getErrorMessage - normalize an unknown error into a string message.
 *
 * @param error - unknown thrown value
 * @returns user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}
