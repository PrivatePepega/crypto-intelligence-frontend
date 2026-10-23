import axios from "axios";

/**
 * Turns an unknown API error into a message that is safe to show in the UI.
 * Backend errors use `{ message: string }`, so prefer that when available.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }

    if (!error.response) {
      return "Could not reach the server. Please try again.";
    }
  }

  return fallback;
}
