import { ApiError } from "@/api/error";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";

/** A message that is safe to show: the server's own text for API errors we raised, a friendly version for anything else. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  return toUserFriendlyApiErrorMessage(error, error instanceof ApiError ? error.message : fallback);
}
