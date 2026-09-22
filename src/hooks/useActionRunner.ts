import { useCallback } from "react";
import { ApiError } from "@/api/error";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { formatActionErrorMessage, formatActionSuccessMessage } from "@/utils/actionToast";

/**
 * Wraps a mutating action with the loading-flag / success-toast / error-toast
 * pattern shared by the big admin dashboard pages (Overview, Uploads,
 * Background Verification, Masters, Reports) — previously duplicated
 * near-verbatim in each of those files.
 *
 * `onSuccess` lets a caller run something extra after a successful action
 * (e.g. Overview refreshing its summary metrics) without every page having to
 * carry that behavior.
 */
export function useActionRunner(
  setActionLoading: (loading: boolean) => void,
  onSuccess?: () => void
) {
  return useCallback(
    async (label: string, fn: () => Promise<unknown>) => {
      setActionLoading(true);
      try {
        await fn();
        showSuccessToast(formatActionSuccessMessage(label));
        onSuccess?.();
      } catch (error) {
        const backendMessage =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "";
        showErrorToast(formatActionErrorMessage(label, backendMessage));
      } finally {
        setActionLoading(false);
      }
    },
    [setActionLoading, onSuccess]
  );
}
