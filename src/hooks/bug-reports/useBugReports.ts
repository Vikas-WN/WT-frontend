"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/error";
import { BUG_REPORT_PAGE_SIZE, BUG_REPORT_QUERY_KEYS } from "@/constants/bugReports";
import { notifyError, notifySuccess } from "@/lib/notify";
import { bugReportService } from "@/services/bugReports.service";
import type { BugReportCreatePayload, BugReportUpdatePayload, BugSeverity, BugStatus } from "@/types/bugReport";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";

function apiErrorMessage(error: unknown, fallback: string): string {
  return toUserFriendlyApiErrorMessage(error, error instanceof ApiError ? error.message : fallback);
}

export function useMyBugReports() {
  return useQuery({
    queryKey: BUG_REPORT_QUERY_KEYS.mine,
    queryFn: async () => (await bugReportService.mine()).data ?? [],
    staleTime: 30_000,
  });
}

/** HR/Admin: every report, filtered and paged. */
export function useAllBugReports(filters: { status?: BugStatus; severity?: BugSeverity; page: number }, enabled: boolean) {
  return useQuery({
    queryKey: BUG_REPORT_QUERY_KEYS.list(filters.status, filters.severity, filters.page),
    enabled,
    queryFn: async () =>
      (await bugReportService.list({ ...filters, size: BUG_REPORT_PAGE_SIZE })).data ?? { total: 0, items: [] },
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}

export function useCreateBugReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BugReportCreatePayload) => bugReportService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BUG_REPORT_QUERY_KEYS.all });
      notifySuccess("Thanks — your report was sent to HR and Admin.");
    },
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't send your report.")),
  });
}

export function useUpdateBugReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BugReportUpdatePayload }) =>
      bugReportService.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BUG_REPORT_QUERY_KEYS.all });
      notifySuccess("Bug report updated — the reporter has been notified.");
    },
    onError: (error) => notifyError(apiErrorMessage(error, "Couldn't update that report.")),
  });
}
