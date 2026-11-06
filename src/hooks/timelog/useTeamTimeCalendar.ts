"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { hrmsService } from "@/services/hrms.service";
import { daysOfMonth, isoDay } from "@/utils/timelog/teamCalendar";
import type { MonthRef } from "@/utils/timelog/monthWeeks";

/**
 * Everything the team-time calendar needs for a month. The server decides who is in it: HR and Admin see everyone,
 * a project manager sees the people on their projects.
 */
export function useTeamTimeCalendar(month: MonthRef) {
  const days = useMemo(() => daysOfMonth(month.year, month.month), [month.year, month.month]);
  const query = useQuery({
    queryKey: ["team-time-calendar", month.year, month.month],
    staleTime: 60_000,
    queryFn: async () => {
      const res = await hrmsService.getTeamTimeCalendar({ year: month.year, month: month.month + 1 });
      return res.data ?? null;
    },
  });

  return {
    days,
    today: isoDay(new Date()),
    people: query.data?.people ?? [],
    hoursByEmail: query.data?.hours ?? {},
    absencesByEmail: query.data?.absences ?? {},
    holidays: query.data?.holidays ?? [],
    loading: query.isLoading,
    refreshing: query.isFetching,
    error: query.error ? "Could not load the team calendar." : null,
    reload: () => void query.refetch(),
  };
}
