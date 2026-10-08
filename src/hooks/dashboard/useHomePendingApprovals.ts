"use client";

import { useQuery } from "@tanstack/react-query";

import { HOME_APPROVALS_QUERY_KEY, HOME_APPROVALS_WINDOW } from "@/constants/homeCards";
import { formatApiDate, parseApiDate } from "@/utils/apiDate";
import { collectPendingApprovals, type PendingApprovalItem } from "@/utils/homePendingApprovals";
import { fetchPaginatedScopedUserRequests } from "@/utils/userRequest";

type Status = "loading" | "done" | "error";

/** The two lists an approver can be responsible for: project-allocated employees (org) and the rest (team). */
const SCOPES: ReadonlyArray<{ orgScope?: boolean; hrTeamScope?: boolean }> = [{ orgScope: true }, { hrTeamScope: true }];

function dayOffset(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return formatApiDate(d);
}

async function loadPending(): Promise<PendingApprovalItem[]> {
  const today = new Date();
  const fromDate = dayOffset(today, -HOME_APPROVALS_WINDOW.daysBack);
  const toDate = dayOffset(today, HOME_APPROVALS_WINDOW.daysForward);
  // One list failing must not blank the card, so each is tried on its own.
  const lists = await Promise.all(
    SCOPES.map((scope) =>
      fetchPaginatedScopedUserRequests({ fromDate, toDate, requestType: "ALL", page: 0, size: HOME_APPROVALS_WINDOW.pageSize, ...scope })
        .then((res) => res.rows)
        .catch(() => null)
    )
  );
  if (lists.every((l) => l === null)) throw new Error("approvals unavailable");
  return collectPendingApprovals(lists.filter((l): l is Array<Record<string, unknown>> => l !== null), parseApiDate);
}

/** Requests waiting for this person's decision — the count and the soonest few. Not fetched for people who cannot approve. */
export function useHomePendingApprovals(enabled: boolean): { status: Status; count: number | null; items: PendingApprovalItem[] } {
  const query = useQuery({ queryKey: HOME_APPROVALS_QUERY_KEY, queryFn: loadPending, enabled, staleTime: HOME_APPROVALS_WINDOW.staleMs });
  if (!enabled) return { status: "done", count: null, items: [] };
  if (query.isError) return { status: "error", count: null, items: [] };
  if (query.isPending) return { status: "loading", count: null, items: [] };
  return { status: "done", count: query.data.length, items: query.data };
}
