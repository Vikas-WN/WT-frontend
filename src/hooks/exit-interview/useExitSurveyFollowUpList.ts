"use client";

import { useQuery } from "@tanstack/react-query";
import { exitInterviewService } from "@/services/exitInterview.service";
import {
  sortExitSurveyFollowUpRows,
  type ExitSurveyFollowUpRow,
} from "@/utils/exitSurveyFollowUp";
import type { OffboardListItem } from "@/types/offboard";

const FOLLOW_UP_FETCH_SIZE = 100;

export const EXIT_SURVEY_FOLLOW_UP_QUERY_KEY = ["exit-survey", "follow-up"] as const;

export function exitSurveyFollowUpQueryKey(filters: {
  search: string;
  filterType: string;
  filterFromDate: string;
  filterToDate: string;
}) {
  return [
    ...EXIT_SURVEY_FOLLOW_UP_QUERY_KEY,
    filters.search.trim(),
    filters.filterType.trim(),
    filters.filterFromDate.trim(),
    filters.filterToDate.trim(),
  ] as const;
}

export type ExitSurveyFollowUpQueryResult = {
  rows: ExitSurveyFollowUpRow[];
  warning?: string;
};

function mapFollowUpItem(item: OffboardListItem): ExitSurveyFollowUpRow {
  return {
    emp_id: item.emp_id ?? null,
    employee_name: item.employee_name,
    email: item.email,
    last_working_day: item.last_working_day,
    resignation_date: item.resignation_date ?? null,
    employee_status: item.employee_status ?? null,
    submission_status: item.submission_status,
    submitted_at: item.submitted_at ?? null,
    lookup_id: item.lookup_id,
    exit_survey_submitted: Boolean(item.exit_survey_submitted),
    can_resend_exit_survey: Boolean(item.can_resend_exit_survey),
    can_view_submission: item.can_view_submission,
  };
}

async function fetchExitSurveyFollowUpRows(filters: {
  search: string;
  filterType: string;
  filterFromDate: string;
  filterToDate: string;
}): Promise<ExitSurveyFollowUpQueryResult> {
  const hasCustomLwdFilter = Boolean(
    filters.filterFromDate.trim() || filters.filterToDate.trim()
  );
  const search = filters.search.trim();

  const res = await exitInterviewService.getFollowUpList({
    page: 0,
    size: FOLLOW_UP_FETCH_SIZE,
    search: search || undefined,
    type: filters.filterType.trim() || undefined,
    fromDate: hasCustomLwdFilter ? filters.filterFromDate.trim() || undefined : undefined,
    toDate: hasCustomLwdFilter ? filters.filterToDate.trim() || undefined : undefined,
  });

  const rows = (res.data?.items ?? []).map(mapFollowUpItem);

  return { rows };
}

export function useExitSurveyFollowUpList(filters: {
  search: string;
  filterType: string;
  filterFromDate: string;
  filterToDate: string;
  enabled?: boolean;
}) {
  const enabled = filters.enabled ?? true;

  return useQuery({
    queryKey: exitSurveyFollowUpQueryKey(filters),
    enabled,
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => fetchExitSurveyFollowUpRows(filters),
  });
}

export { sortExitSurveyFollowUpRows };
