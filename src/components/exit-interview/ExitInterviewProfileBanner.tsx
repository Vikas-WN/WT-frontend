"use client";

import Link from "next/link";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";
import { useExitInterviewProfile } from "@/hooks/exit-interview/useExitInterviewProfile";
import {
  INFO_BANNER_BODY_CLASS,
  INFO_BANNER_CLASS,
  INFO_BANNER_TITLE_CLASS,
  LINK_CLASS,
} from "@/components/dashboard/ui/uiLayout";

export function ExitInterviewProfileBanner() {
  const { isOffboarded } = useDashboardAccess();
  const { data, isLoading } = useExitInterviewProfile();
  const flags = data?.flags;

  if (isOffboarded || isLoading || !flags?.exit_interview_applicable) return null;

  if (flags.exit_interview_submitted) {
    return (
      <div className="mb-6 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-900 dark:text-emerald-200">
        Your exit survey has been submitted. Thank you.
      </div>
    );
  }

  if (flags.can_fill_exit_interview) {
    const days = flags.exit_interview_days_until_last_working_day;
    return (
      <div className={`mb-6 ${INFO_BANNER_CLASS}`}>
        <p className={INFO_BANNER_TITLE_CLASS}>Exit Survey Due</p>
        <p className={INFO_BANNER_BODY_CLASS}>
          Please complete your exit survey before your last working day
          {days != null ? ` (${days} day${days === 1 ? "" : "s"} remaining)` : ""}.
        </p>
        <Link href={DASHBOARD_ROUTES["exit-interview"]} className={`mt-3 inline-block text-sm ${LINK_CLASS}`}>
          Open Exit Survey →
        </Link>
      </div>
    );
  }

  return null;
}
