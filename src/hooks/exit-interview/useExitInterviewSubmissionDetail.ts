"use client";

import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/api/endpoints";
import { exitInterviewService } from "@/services/exitInterview.service";

export function useExitInterviewSubmissionDetail(
  lookupId: string,
  options?: { enabled?: boolean }
) {
  // Already decoded by the router; decoding again would corrupt ids containing "%".
  const id = lookupId.trim();
  const enabled = (options?.enabled ?? true) && Boolean(id);

  return useQuery({
    queryKey: ["exit-interview", "submission", id, endpoints.exitInterview.submissionByLookupId(id)],
    enabled,
    staleTime: 60_000,
    // A submission can be reopened or deleted between listing and viewing, so always
    // refetch on open rather than rendering a stale "submitted" record.
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const res = await exitInterviewService.getSubmission(id);
      return res.data ?? null;
    },
  });
}
