"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { hrmsService, type WhosOutData } from "@/services/hrms.service";
import { daysOfMonth, isoDay } from "@/utils/timelog/teamCalendar";
import type { MonthRef } from "@/utils/timelog/monthWeeks";

type DayTotals = Record<string, Record<string, number>>;

/**
 * Everything the team-time calendar needs for a month: approved hours per person per day, plus who was on leave or
 * working from home and which holidays fell in it (the same source as Who's out, organisation-wide).
 */
export function useTeamTimeCalendar(emails: string[], month: MonthRef, enabled: boolean) {
  const days = useMemo(() => daysOfMonth(month.year, month.month), [month.year, month.month]);
  const from = days[0];
  const to = days[days.length - 1];
  const sortedEmails = useMemo(() => [...emails].sort(), [emails]);

  const hoursQuery = useQuery({
    queryKey: ["team-time-calendar", "hours", from, to, sortedEmails],
    enabled: enabled && sortedEmails.length > 0,
    staleTime: 60_000,
    queryFn: async (): Promise<DayTotals> => {
      const res = await hrmsService.getTimelogDayTotalsBatch({ startDate: from, endDate: to, employeeEmails: sortedEmails });
      return ((res as { data?: DayTotals }).data ?? {}) as DayTotals;
    },
  });

  const absenceQuery = useQuery({
    queryKey: ["team-time-calendar", "absences", from, to],
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<WhosOutData | null> => {
      const res = await hrmsService.getWhosOut({ from, to, scope: "org" });
      return res.data ?? null;
    },
  });

  const absencesByEmail = useMemo(() => {
    const map: Record<string, WhosOutData["people"][number]["entries"]> = {};
    for (const person of absenceQuery.data?.people ?? []) map[person.email.trim().toLowerCase()] = person.entries;
    return map;
  }, [absenceQuery.data]);

  return {
    days,
    today: isoDay(new Date()),
    hoursByEmail: hoursQuery.data ?? {},
    absencesByEmail,
    holidays: absenceQuery.data?.holidays ?? [],
    loading: hoursQuery.isLoading || absenceQuery.isLoading,
    error: hoursQuery.error || absenceQuery.error ? "Could not load the team calendar." : null,
    reload: () => {
      void hoursQuery.refetch();
      void absenceQuery.refetch();
    },
  };
}
