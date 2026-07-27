"use client";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PersonalHolidayCalendarView } from "@/components/dashboard/annual-calendar/PersonalHolidayCalendarView";
import { OnboardingGate } from "@/components/dashboard/shared/OnboardingGate";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";

export function AnnualCalendarPageClient() {
  const { requiresSelfOnboarding } = useDashboardAccess();

  return (
    <OnboardingGate requiresSelfOnboarding={requiresSelfOnboarding}>
      <DashboardPageShell>
        <PersonalHolidayCalendarView />
      </DashboardPageShell>
    </OnboardingGate>
  );
}
