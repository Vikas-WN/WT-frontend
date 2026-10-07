"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/error";
import { PULSE_QUERY_KEYS } from "@/constants/pulse";
import { notifyError, notifySuccess } from "@/lib/notify";
import { hrmsService } from "@/services/hrms.service";
import { PULSE_COPY } from "@/constants/pulseCopy";
import type {
  EmployeeSummary,
  ManagerReviewSubmitPayload,
  MonthlySubmissionDraftPayload,
  PulseScoreSettingsWrite,
  PulseWindowPurpose,
  SubmissionCycleScope,
  SubmissionCycleWritePayload,
} from "@/types/kpi";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";

const EMPLOYEE_SUBMISSION = "EMPLOYEE_MONTHLY_SUBMISSION" as const;
const REFERENCE_STALE_MS = 5 * 60_000;

function errorMessage(error: unknown, fallback: string): string {
  return toUserFriendlyApiErrorMessage(error, error instanceof ApiError ? error.message : fallback);
}

/** Is Pulse open for me, for this month? Resolved on the server from my role
 *  (EMPLOYEE / MANAGER window), the Global window and my individual window. */
export function usePulseWindow(month: string, purpose: PulseWindowPurpose) {
  return useQuery({
    queryKey: PULSE_QUERY_KEYS.window(month, purpose),
    queryFn: () => hrmsService.getMyPulseWindow({ month, purpose }),
    staleTime: 30_000,
  });
}

/** My review for one month, read-only (never creates a row). */
export function useMyMonthSubmission(month: string) {
  return useQuery({
    queryKey: PULSE_QUERY_KEYS.mySubmission(month),
    queryFn: async () => {
      const rows = await hrmsService.getMyMonthlySubmissions({ month, submissionType: EMPLOYEE_SUBMISSION });
      return Array.isArray(rows) ? (rows[0] ?? null) : null;
    },
  });
}

/** Every month I have a submission for — the dots on the month picker. */
export function useMySubmissionMonths() {
  return useQuery({
    queryKey: PULSE_QUERY_KEYS.history,
    queryFn: async () => {
      const rows = await hrmsService.getMyMonthlySubmissionHistory();
      return new Set((Array.isArray(rows) ? rows : []).map((r) => r.month));
    },
  });
}

/** The editable draft — fetching it starts one, so only enable it while the
 *  window is open. Never refetched behind the form's back: the form owns its
 *  state once mounted. */
export function useMonthDraft(month: string, enabled: boolean) {
  return useQuery({
    queryKey: PULSE_QUERY_KEYS.draft(month),
    enabled,
    queryFn: () => hrmsService.getMonthlySubmissionDraft({ month }),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useApplicableKpis() {
  return useQuery({
    queryKey: PULSE_QUERY_KEYS.kpis,
    queryFn: () => hrmsService.getApplicableKpis(),
    staleTime: REFERENCE_STALE_MS,
  });
}

export function useActiveValues() {
  return useQuery({
    queryKey: PULSE_QUERY_KEYS.values,
    queryFn: () => hrmsService.getActiveWebknotValues(),
    staleTime: REFERENCE_STALE_MS,
  });
}

export function useActiveCertifications() {
  return useQuery({
    queryKey: PULSE_QUERY_KEYS.certifications,
    queryFn: () => hrmsService.getCertifications({ activeOnly: true }),
    staleTime: REFERENCE_STALE_MS,
  });
}

/** An active project, identified to the employee by who will review it. */
export type PulseProjectOption = { code: string; name: string; managers: EmployeeSummary[] };

export function useMyPulseProjects() {
  return useQuery({
    queryKey: PULSE_QUERY_KEYS.projects,
    queryFn: async (): Promise<PulseProjectOption[]> => {
      const rows = await hrmsService.getMyPulseProjects();
      return rows.map((row) => ({ code: row.project_code, name: row.project_name, managers: row.managers }));
    },
    staleTime: REFERENCE_STALE_MS,
  });
}

/** DM / PM / AM / HR / Admin pick an HR or Admin reviewer. */
export function useAdminReviewers(enabled: boolean) {
  return useQuery({
    queryKey: PULSE_QUERY_KEYS.adminReviewers,
    enabled,
    queryFn: () => hrmsService.getPulseAdminReviewers(),
    staleTime: REFERENCE_STALE_MS,
  });
}

export function useSaveDraft() {
  return useMutation({
    mutationFn: (payload: MonthlySubmissionDraftPayload) => hrmsService.saveMonthlySubmissionDraft(payload),
  });
}

export function useSubmitSelfReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MonthlySubmissionDraftPayload) => hrmsService.submitMonthlySubmission(payload),
    onSuccess: () => {
      notifySuccess("Self review submitted.");
      void queryClient.invalidateQueries({ queryKey: PULSE_QUERY_KEYS.all });
    },
    onError: (error) => notifyError(errorMessage(error, "Couldn't submit your review.")),
  });
}

export function useManagerTeam(enabled = true) {
  return useQuery({
    queryKey: PULSE_QUERY_KEYS.managerTeam,
    enabled,
    queryFn: () => hrmsService.getManagerTeamSubmissions(),
  });
}

export function useSubmitManagerReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ManagerReviewSubmitPayload }) =>
      hrmsService.submitManagerReview(id, payload),
    onSuccess: (_data, { payload }) => {
      notifySuccess(payload.action === "SUBMIT" ? PULSE_COPY.managerSubmittedToast : PULSE_COPY.managerRejectedToast);
      void queryClient.invalidateQueries({ queryKey: PULSE_QUERY_KEYS.all });
    },
    onError: (error) => notifyError(errorMessage(error, "Couldn't submit your review.")),
  });
}

// --- Scoring settings (HR/Admin) ---

export function usePulseScoring() {
  return useQuery({
    queryKey: PULSE_QUERY_KEYS.scoring,
    queryFn: () => hrmsService.getPulseScoreSettings(),
  });
}

export function useSaveScoring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PulseScoreSettingsWrite | "reset") =>
      payload === "reset" ? hrmsService.resetPulseScoreSettings() : hrmsService.updatePulseScoreSettings(payload),
    onSuccess: (next, payload) => {
      queryClient.setQueryData(PULSE_QUERY_KEYS.scoring, next);
      notifySuccess(payload === "reset" ? "Scoring reset to defaults." : "Scoring saved.");
    },
    onError: (error) => notifyError(errorMessage(error, "Couldn't save the scoring settings.")),
  });
}

// --- Submission Portal (HR/Admin) ---

export function useSubmissionCycles() {
  return useQuery({
    queryKey: PULSE_QUERY_KEYS.cycles,
    queryFn: async () => {
      const res = await hrmsService.getSubmissionCycles();
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function useWindowCandidates(query: string) {
  return useQuery({
    queryKey: PULSE_QUERY_KEYS.candidates(query),
    queryFn: () => hrmsService.searchPulseWindowCandidates(query),
    staleTime: 60_000,
  });
}

type CycleChange =
  | { kind: "create"; payload: SubmissionCycleWritePayload; success: string }
  | { kind: "update"; id: number; changes: Partial<SubmissionCycleWritePayload>; success: string }
  | { kind: "delete"; id: number; success: string };

/** Create / update / remove one window, then refresh every Pulse screen. */
export function useChangeCycle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: CycleChange) => {
      if (change.kind === "create") return hrmsService.createSubmissionCycle(change.payload);
      if (change.kind === "update") return hrmsService.updateSubmissionCycle(change.id, change.changes);
      return hrmsService.deleteSubmissionCycle(change.id);
    },
    onSuccess: (_data, change) => {
      notifySuccess(change.success);
      void queryClient.invalidateQueries({ queryKey: PULSE_QUERY_KEYS.all });
    },
    onError: (error) => notifyError(errorMessage(error, "Couldn't update the window.")),
  });
}

export type { SubmissionCycleScope };

/** HR/Admin insights for a six-month cycle (the current one when `cycleKey` is empty): distribution, year trend, results. */
export function usePulseInsights(cycleKey: string) {
  return useQuery({
    queryKey: PULSE_QUERY_KEYS.insights(cycleKey),
    queryFn: () => hrmsService.getPulseInsights(cycleKey || undefined),
    staleTime: 60_000,
  });
}
