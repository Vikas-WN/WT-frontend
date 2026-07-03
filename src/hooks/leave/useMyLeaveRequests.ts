"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatApiDate } from "@/utils/apiDate";
import { listSelfUserRequests } from "@/utils/userRequest";

export const MY_LEAVE_REQUESTS_QUERY_KEY = ["leave", "my-requests"] as const;

export function myLeaveRequestsBaseQueryKey(email?: string | null) {
  return [...MY_LEAVE_REQUESTS_QUERY_KEY, email ?? "anonymous"] as const;
}

export function defaultMyLeaveRequestRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  return {
    fromDate: formatApiDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    toDate: formatApiDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
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

  const defaultRange = useMemo(() => defaultMyLeaveRequestRange(), []);
  const effectiveFromDate = fromDate ?? defaultRange.fromDate;
  const effectiveToDate = toDate ?? defaultRange.toDate;

  const queryKey = useMemo(
    () => [...myLeaveRequestsBaseQueryKey(normalizedEmail), effectiveFromDate, effectiveToDate],
    [normalizedEmail, effectiveFromDate, effectiveToDate]
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
