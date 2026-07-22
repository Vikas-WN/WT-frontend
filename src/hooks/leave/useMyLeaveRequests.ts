"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatApiDate } from "@/utils/apiDate";
import { listSelfUserRequests } from "@/utils/userRequest";

export const MY_LEAVE_REQUESTS_QUERY_KEY = ["leave", "my-requests"] as const;

export function myLeaveRequestsBaseQueryKey(email?: string | null) {
  return [...MY_LEAVE_REQUESTS_QUERY_KEY, email ?? "anonymous"] as const;
}

/** Wide range used when From/To filters are empty (backend max span ≈ 730 days). */
export function unfilteredLeaveRequestRange(): { fromDate: string; toDate: string } {
  const today = new Date();
  const to = new Date(today);
  to.setFullYear(to.getFullYear() + 1);
  const from = new Date(to);
  from.setDate(from.getDate() - 730);
  return {
    fromDate: formatApiDate(from),
    toDate: formatApiDate(to),
  };
}

/** @deprecated Prefer unfilteredLeaveRequestRange / empty UI filters. */
export function defaultMyLeaveRequestRange(): { fromDate: string; toDate: string } {
  return unfilteredLeaveRequestRange();
}

function dedupeByRequestId(rows: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  return Array.from(
    new Map(
      rows.map((row) => {
        const key = String(row.user_request_id ?? row.userRequestId ?? row.id ?? Math.random());
        return [key, row] as const;
      })
    ).values()
  );
}

export function useMyLeaveRequests(
  email: string,
  enabled = false,
  fromDate?: string,
  toDate?: string
) {
  const queryClient = useQueryClient();
  const normalizedEmail = email.trim();
  const selectedFrom = String(fromDate ?? "").trim();
  const selectedTo = String(toDate ?? "").trim();
  const fallbackRange = useMemo(() => unfilteredLeaveRequestRange(), []);
  const hasDateFilter = Boolean(selectedFrom && selectedTo);
  const effectiveFromDate = hasDateFilter ? selectedFrom : fallbackRange.fromDate;
  const effectiveToDate = hasDateFilter ? selectedTo : fallbackRange.toDate;

  const queryKey = useMemo(
    () => [
      ...myLeaveRequestsBaseQueryKey(normalizedEmail),
      hasDateFilter ? selectedFrom : "all",
      hasDateFilter ? selectedTo : "all",
    ],
    [normalizedEmail, hasDateFilter, selectedFrom, selectedTo]
  );

  const fetchFn = useCallback(async () => {
    const rows = await listSelfUserRequests({
      fromDate: effectiveFromDate,
      toDate: effectiveToDate,
      requestType: "ALL" as const,
      size: 200,
    });
    return dedupeByRequestId(rows);
  }, [effectiveFromDate, effectiveToDate]);

  const query = useQuery({
    queryKey,
    enabled: enabled && Boolean(normalizedEmail),
    staleTime: 120_000,
    gcTime: 300_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: fetchFn,
  });

  return {
    ...query,
    rows: query.data ?? [],
    invalidate: () =>
      queryClient.invalidateQueries({
        queryKey: myLeaveRequestsBaseQueryKey(normalizedEmail),
      }),
    refetch: query.refetch,
  };
}
