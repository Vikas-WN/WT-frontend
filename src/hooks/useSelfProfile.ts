"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchSelfProfile, shouldSkipSelfProfileFetch } from "@/utils/selfProfile";
import { parseExitInterviewProfileFlags } from "@/utils/exitInterview";
import {
  isPreActiveEmployeeStatus,
  isServingNoticeUserStatus,
  resolveProfileStatus,
} from "@/utils/userStatus";

export const SELF_PROFILE_QUERY_KEY = ["profile", "self"] as const;
export const EXIT_SURVEY_PROFILE_POLL_MS = 30_000;

export function selfProfileQueryKey(email?: string | null) {
  return [...SELF_PROFILE_QUERY_KEY, email ?? "anonymous"] as const;
}

export function shouldPollSelfProfile(
  profile: Record<string, unknown> | null | undefined
): number | false {
  if (!profile) return false;
  const status = resolveProfileStatus(profile);
  if (isPreActiveEmployeeStatus(status)) return false;
  const flags = parseExitInterviewProfileFlags(profile);
  if (isServingNoticeUserStatus(status)) return EXIT_SURVEY_PROFILE_POLL_MS;
  if (flags.exit_interview_applicable && flags.can_fill_exit_interview) {
    return EXIT_SURVEY_PROFILE_POLL_MS;
  }
  return false;
}

export function useSelfProfile(enabled = true) {
  const { user } = useAuth();
  const userRoles = user?.roles ?? [];
  const shouldFetch = enabled && Boolean(user) && !shouldSkipSelfProfileFetch(userRoles);

  return useQuery({
    queryKey: selfProfileQueryKey(user?.email),
    enabled: shouldFetch,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: (query) =>
      shouldPollSelfProfile(query.state.data as Record<string, unknown> | null | undefined),
    queryFn: async () => fetchSelfProfile(userRoles),
  });
}
