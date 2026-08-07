"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatApiDate } from "@/utils/apiDate";
import { listScopedUserRequests } from "@/utils/userRequest";
import {
  isAssignedLeaveManager,
  isOwnUserRequest,
} from "@/utils/leaveManagerDisplay";

export const PRIMARY_MANAGER_INBOX_QUERY_KEY = ["leave", "primary-manager-inbox"] as const;

export function primaryManagerInboxQueryKey(email?: string | null) {
  return [...PRIMARY_MANAGER_INBOX_QUERY_KEY, email ?? "anonymous"] as const;
}

function filterLeaveManagerInbox(
  rows: Array<Record<string, unknown>>,
  actorEmail: string
): Array<Record<string, unknown>> {
  const email = actorEmail.trim().toLowerCase();
  if (!email) return [];

  return rows.filter((row) => {
    if (isOwnUserRequest(row, email)) return false;
    return isAssignedLeaveManager(row, email);
  });
}

async function fetchLeaveManagerInbox(actorEmail: string): Promise<Array<Record<string, unknown>>> {
  const today = new Date();
  const start = new Date(today.getFullYear() - 1, 0, 1);
  const end = new Date(today);
  end.setFullYear(end.getFullYear() + 2);
  const fromDate = formatApiDate(start);
  const toDate = formatApiDate(end);

  const [leaveRows, wfhRows, optionalRows] = await Promise.all([
    listScopedUserRequests({
      fromDate,
      toDate,
      requestType: "LEAVE",
    }),
    listScopedUserRequests({
      fromDate,
      toDate,
      requestType: "WFH",
    }),
    listScopedUserRequests({
      fromDate,
      toDate,
      requestType: "OPTIONAL",
    }),
  ]);

  const merged = Array.from(
    new Map(
      [...leaveRows, ...wfhRows, ...optionalRows].map((row) => {
        const key = String(
          row.user_request_id ??
            row.userRequestId ??
            row.request_id ??
            row.requestId ??
            row.id ??
            Math.random()
        );
        return [key, row] as const;
      })
    ).values()
  );

  return filterLeaveManagerInbox(merged, actorEmail);
}

/** Inbox for assigned primary or secondary leave/WFH managers. */
export function usePrimaryManagerLeaveInbox(actorEmail: string, enabled = true) {
  const queryClient = useQueryClient();
  const normalizedEmail = actorEmail.trim();

  const query = useQuery({
    queryKey: primaryManagerInboxQueryKey(normalizedEmail),
    enabled: enabled && Boolean(normalizedEmail),
    staleTime: 120_000,
    gcTime: 300_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => fetchLeaveManagerInbox(normalizedEmail),
  });

  return {
    ...query,
    rows: query.data ?? [],
    invalidate: () =>
      queryClient.invalidateQueries({
        queryKey: primaryManagerInboxQueryKey(normalizedEmail),
      }),
    refetch: query.refetch,
  };
}
