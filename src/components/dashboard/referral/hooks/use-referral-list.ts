"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/api/endpoints";
import { apiClient } from "@/api/httpClient";
import { REFERRAL_QUERY_KEYS } from "@/components/dashboard/referral/referral-page-client.constants";

export interface ReferralListItem {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  job_title: string;
  job_id: string;
  resume_url?: string;
  status: string;
  ats_score?: number | null;
  ats_score_ready?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ReferralListResponse {
  items: ReferralListItem[];
  total: number;
  page: number;
  size: number;
}

export function useReferralList(email: string) {
  const { data, isLoading, isRefetching, error, refetch } = useQuery({
    queryKey: REFERRAL_QUERY_KEYS.list(email),
    enabled: Boolean(email),
    queryFn: async () => {
      const res = await apiClient.get<Record<string, unknown>>(endpoints.referral.root, {
        query: { referrer_email: email },
      });
      const payload = (res as unknown as { data: Record<string, unknown> }).data ?? {};
      const items = (payload.items as Record<string, unknown>[]) ?? [];
      const total = (payload.total as number) ?? 0;

      return {
        items: items.map((item) => ({
          id: String(item.id ?? ""),
          candidate_name: String(item.candidate_name ?? ""),
          candidate_email: String(item.candidate_email ?? ""),
          candidate_phone: item.candidate_phone ? String(item.candidate_phone) : undefined,
          job_title: String(item.job_title ?? ""),
          job_id: String(item.job_id ?? ""),
          resume_url: item.resume_url ? String(item.resume_url) : undefined,
          status: String(item.status ?? ""),
          ats_score: item.ats_score !== undefined && item.ats_score !== null ? Number(item.ats_score) : null,
          ats_score_ready: Boolean(item.ats_score_ready),
          created_at: String(item.created_at ?? ""),
          updated_at: item.updated_at ? String(item.updated_at) : undefined,
        })),
        total,
      };
    },
    staleTime: 30_000,
  });

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    isRefetching,
    error: error ? (error instanceof Error ? error.message : "Failed to load referrals") : null,
    refetch,
  };
}