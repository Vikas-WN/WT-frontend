"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/api/endpoints";
import { apiClient } from "@/api/httpClient";
import { REFERRAL_QUERY_KEYS } from "@/components/dashboard/referral/referral-page-client.constants";

export interface ReferralListItem {
  id: number;
  candidate_name: string;
  candidate_email: string;
  resume_url: string | null;
  job_title: string;
  job_id: string;
  status: string;
  ats_score: number | null;
  ats_score_ready: boolean;
  created_at: string; // isoformat from backend
}

/** Soft UI refresh while background ATS worker finishes recent scores. */
const ATS_POLL_WINDOW_MS = 90_000;
const ATS_POLL_INTERVAL_MS = 4_000;

function mapReferral(raw: Record<string, unknown>): ReferralListItem {
  return {
    id: Number(raw.id ?? 0),
    candidate_name: String(raw.candidate_name ?? ""),
    candidate_email: String(raw.candidate_email ?? ""),
    resume_url: raw.resume_url ? String(raw.resume_url) : null,
    job_title: String(raw.job_title ?? ""),
    job_id: String(raw.job_id ?? ""),
    status: String(raw.status ?? "SUBMITTED"),
    ats_score:
      raw.ats_score == null || raw.ats_score === "" ? null : Number(raw.ats_score),
    ats_score_ready: Boolean(raw.ats_score_ready),
    created_at: String(raw.created_at ?? ""),
  };
}

function isRecentPendingAts(item: ReferralListItem, nowMs: number): boolean {
  if (item.ats_score_ready) return false;
  const createdMs = Date.parse(item.created_at);
  if (Number.isNaN(createdMs)) return false;
  return nowMs - createdMs < ATS_POLL_WINDOW_MS;
}

type UseReferralListResult = {
  items: ReferralListItem[];
  total: number;
  isLoading: boolean;
  isRefetching: boolean;
  error: string | null;
};

export function useReferralList(referrerEmail: string): UseReferralListResult {
  const { data, isLoading, isRefetching, error } = useQuery({
    queryKey: REFERRAL_QUERY_KEYS.list(referrerEmail),
    queryFn: async () => {
      const res = await apiClient.get<Record<string, unknown>>(
        endpoints.referral.root,
        { query: { referrer_email: referrerEmail } },
      );
      const payload = (res as unknown as { data: Record<string, unknown> }).data as Record<string, unknown> ?? {};
      const raw = (payload.items as Record<string, unknown>[]) ?? [];
      const total = (payload.total as number) ?? 0;
      return {
        items: raw.map(mapReferral),
        total,
      };
    },
    enabled: Boolean(referrerEmail),
    staleTime: 30_000,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const now = Date.now();
      const shouldPoll = items.some((item) => isRecentPendingAts(item, now));
      return shouldPoll ? ATS_POLL_INTERVAL_MS : false;
    },
  });

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isRefetching,
    error: error ? (error instanceof Error ? error.message : "Failed to load referrals") : null,
  };
}
