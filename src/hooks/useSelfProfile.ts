"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchSelfProfile, shouldSkipSelfProfileFetch } from "@/utils/selfProfile";

export const SELF_PROFILE_QUERY_KEY = ["profile", "self"] as const;

export function selfProfileQueryKey(email?: string | null) {
  return [...SELF_PROFILE_QUERY_KEY, email ?? "anonymous"] as const;
}

export function useSelfProfile(enabled = true) {
  const { user } = useAuth();
  const userRoles = user?.roles ?? [];
  const shouldFetch = enabled && Boolean(user) && !shouldSkipSelfProfileFetch(userRoles);

  return useQuery({
    queryKey: selfProfileQueryKey(user?.email),
    enabled: shouldFetch,
    staleTime: 5 * 60_000,
    refetchOnMount: false,
    // Poll so a server-side status change (e.g. HR re-inviting an employee) reaches
    // the onboarding guard without a manual page refresh. Pauses in background tabs.
    refetchInterval: 10_000,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: false,
    queryFn: async () => fetchSelfProfile(userRoles),
  });
}
