"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { endpoints } from "@/api/endpoints";
import { apiClient } from "@/api/httpClient";
import type { Job } from "@/components/dashboard/referral/referral-page-client.types";

function mapJob(raw: Record<string, unknown>): Job {
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    department: String(raw.department ?? ""),
    location: String(raw.location ?? ""),
    type: String(raw.type ?? "Full-time"),
    skills: Array.isArray(raw.requirements) ? (raw.requirements as string[]) : [],
    postedAt: "",
    urgency: "Normal" as const,
  };
}

export function useReferralJobsInfinite(q: string) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    queryKey: ["referral-jobs-infinite", q],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient.get<Record<string, unknown>>(endpoints.referral.jobs, {
        query: { page: pageParam, limit: 20, q: q || undefined },
      });
      const payload = (res as unknown as { data: Record<string, unknown> }).data ?? {};
      const items = ((payload.items as Record<string, unknown>[]) ?? []).map(mapJob);
      const total = (payload.total as number) ?? 0;
      return { items, total, nextPage: items.length > 0 ? pageParam + 1 : undefined };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });

  const jobs = data?.pages.flatMap((p) => p.items) ?? [];

  return {
    jobs,
    isLoading,
    isFetchingNextPage,
    hasMore: Boolean(hasNextPage),
    error: error ? (error instanceof Error ? error.message : "Failed to load jobs") : null,
    loadMore: fetchNextPage,
  };
}
