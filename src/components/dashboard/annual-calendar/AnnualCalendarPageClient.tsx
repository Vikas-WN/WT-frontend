"use client";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PersonalHolidayCalendarView } from "@/components/dashboard/annual-calendar/PersonalHolidayCalendarView";

export function AnnualCalendarPageClient() {
  return (
    <DashboardPageShell>
      <PersonalHolidayCalendarView />
    </DashboardPageShell>
  );
}
