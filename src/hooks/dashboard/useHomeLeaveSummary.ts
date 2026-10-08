"use client";

import { useMemo } from "react";

import {
  HOME_LEAVE_MONTHS_BACK,
  HOME_LEAVE_MONTHS_FORWARD,
  HOME_LEAVE_OPEN_STATUSES,
  HOME_LEAVE_REQUEST_TYPES,
} from "@/constants/homeLeaveCard";
import { useAuth } from "@/context/AuthContext";
import { useMyLeaveBalance } from "@/hooks/leave/useMyLeaveBalance";
import { useMyLeaveRequests } from "@/hooks/leave/useMyLeaveRequests";
import { formatApiDate, parseApiDate } from "@/utils/apiDate";
import { selectOpenLeaveRequests } from "@/utils/homeLeaveRequests";
import { requestFinalStatus } from "@/utils/userRequest";

/** Everything the home "My leave balance" card shows: the balance split and the requests that are open or coming up. */
export function useHomeLeaveSummary() {
  const { user } = useAuth();
  const balance = useMyLeaveBalance();

  const range = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - HOME_LEAVE_MONTHS_BACK, 1);
    const to = new Date(now.getFullYear(), now.getMonth() + HOME_LEAVE_MONTHS_FORWARD + 1, 0);
    return { fromDate: formatApiDate(from), toDate: formatApiDate(to) };
  }, []);
  const requests = useMyLeaveRequests(user?.email ?? "", true, range.fromDate, range.toDate);

  const items = useMemo(
    () =>
      selectOpenLeaveRequests(requests.rows, new Date(), {
        types: HOME_LEAVE_REQUEST_TYPES,
        openStatuses: HOME_LEAVE_OPEN_STATUSES,
        statusOf: requestFinalStatus,
        parseDate: parseApiDate,
      }),
    [requests.rows]
  );

  const leave = balance.data?.leave;
  const primary = Number(leave?.primary ?? 0);
  const secondary = Number(leave?.secondary ?? 0);
  return {
    balanceStatus: balance.isLoading ? "loading" : balance.isError || !leave ? "error" : "ready",
    requestsStatus: requests.isLoading ? "loading" : requests.isError ? "error" : "ready",
    primary,
    secondary,
    total: Number(leave?.total ?? primary + secondary),
    compOff: Number(balance.data?.comp_off_balance ?? 0),
    items,
  } as const;
}
