"use client";

import { useCallback, useState } from "react";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  formatActionErrorMessage,
  formatActionSuccessMessage,
} from "@/utils/actionToast";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";

export function useDashboardAction() {
  const [actionLoading, setActionLoading] = useState(false);

  const runAction = useCallback(async (label: string, fn: () => Promise<unknown>) => {
    setActionLoading(true);
    try {
      await fn();
      showSuccessToast(formatActionSuccessMessage(label));
      return true;
    } catch (error) {
      const backendMessage = toUserFriendlyApiErrorMessage(error, "");
      showErrorToast(formatActionErrorMessage(label, backendMessage));
      return false;
    } finally {
      setActionLoading(false);
    }
  }, []);

  return { actionLoading, runAction };
}
