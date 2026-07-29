"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { hrmsService } from "@/services/hrms.service";
import { normalizeToApiDate } from "@/utils/apiDate";

/** Non-optional holiday ISO dates from the company holiday calendar (for leave day counts). */
export function useNonOptionalHolidayDates() {
  const year = new Date().getFullYear();
  const q = useQuery({
    queryKey: ["holiday-calendar", "company", "non-optional", year] as const,
    queryFn: async () => {
      try {
        const res = await hrmsService.getCompanyHolidayCalendar();
        const detail = (res as { data?: unknown }).data ?? res;
        const holidays = Array.isArray((detail as { holidays?: unknown })?.holidays)
          ? ((detail as { holidays: Array<Record<string, unknown>> }).holidays ?? [])
          : [];
        const dates = new Set<string>();
        for (const holiday of holidays) {
          const optional = Boolean(holiday.is_optional ?? holiday.isOptional);
          if (optional) continue;
          const raw = String(holiday.holiday_date ?? holiday.holidayDate ?? "").trim();
          const iso = normalizeToApiDate(raw) || raw.slice(0, 10);
          if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) dates.add(iso);
        }
        return dates;
      } catch {
        return new Set<string>();
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

  return useMemo(() => q.data ?? new Set<string>(), [q.data]);
}
