"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/api/endpoints";
import { apiClient } from "@/api/httpClient";
import { REFERRAL_QUERY_KEYS, REFERRAL_PAGE_SIZE } from "@/components/dashboard/referral/referral-page-client.constants";
import type { Job } from "@/components/dashboard/referral/referral-page-client.types";

function formatPostedAt(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
}

function mapJob(raw: Record<string, unknown>): Job {
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    department: String(raw.department ?? ""),
    location: String(raw.location ?? ""),
    type: String(raw.type ?? "Full-time"),
    skills: Array.isArray(raw.requirements) ? (raw.requirements as string[]) : [],
    postedAt: formatPostedAt(String(raw.created_at ?? "")),
    urgency: "Normal" as const,
  };
}

type UseReferralJobsResult = {
  jobs: Job[];
  total: number;
  isLoading: boolean;
  error: string | null;
};

export function useReferralJobs(q: string, page: number): UseReferralJobsResult {
  const { data, isLoading, error } = useQuery({
    queryKey: REFERRAL_QUERY_KEYS.jobs(q, page),
    queryFn: async () => {
      const res = await apiClient.get<Record<string, unknown>>(endpoints.referral.jobs, {
        query: { page, limit: REFERRAL_PAGE_SIZE, q: q || undefined },
      });
      const payload = (res as unknown as { data: Record<string, unknown> }).data as Record<string, unknown> ?? {};
      const raw = (payload.items as Record<string, unknown>[]) ?? [];
      const total = (payload.total as number) ?? 0;

      if (q) {
        const lowerQ = q.toLowerCase();
        return {
          items: raw
            .filter((item) =>
              String(item.id ?? "").toLowerCase().includes(lowerQ) ||
              String(item.department ?? "").toLowerCase().includes(lowerQ)
            )
            .map(mapJob),
          total,
        };
      }

      return {
        items: raw.map(mapJob),
        total,
      };
    },
    staleTime: 30_000,
  });

  return {
    jobs: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to load jobs") : null,
  };
}
