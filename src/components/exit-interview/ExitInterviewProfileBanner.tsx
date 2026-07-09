"use client";

import Link from "next/link";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";
import { useExitInterviewProfile } from "@/hooks/exit-interview/useExitInterviewProfile";
import {
  BANNER_BODY_CLASS,
  BANNER_LINK_CLASS,
  BANNER_TITLE_CLASS,
  bannerClass,
} from "@/components/dashboard/ui/bannerTones";
import { canEmployeeAccessExitSurvey } from "@/utils/exitInterview";
import { isPreActiveEmployeeStatus, resolveEffectiveEmployeeStatus, resolveProfileStatus } from "@/utils/userStatus";

export function ExitInterviewProfileBanner() {
  const { isOffboarded, profile, user } = useDashboardAccess();
  const { data, isLoading } = useExitInterviewProfile();
  const flags = data?.flags;
  const employeeStatus = resolveEffectiveEmployeeStatus(
    user?.status,
    resolveProfileStatus(profile ?? data?.profile, user)
  );

  if (
    isOffboarded ||
    isLoading ||
    !flags ||
    !canEmployeeAccessExitSurvey(flags, employeeStatus) ||
    isPreActiveEmployeeStatus(employeeStatus)
  ) {
    return null;
  }

  if (flags.exit_interview_submitted) {
    return (
      <div className={bannerClass("success", "mb-4")}>
        Your exit survey has been submitted. Thank you.
      </div>
    );
  }

  if (flags.can_fill_exit_interview) {
    const days = flags.exit_interview_days_until_last_working_day;
    return (
      <div className={bannerClass("accent", "mb-4")}>
        <p className={BANNER_TITLE_CLASS}>Exit Survey Due</p>
        <p className={BANNER_BODY_CLASS}>
          Please complete your exit survey before your last working day
          {days != null ? ` (${days} day${days === 1 ? "" : "s"} remaining)` : ""}.
        </p>
        <Link href={DASHBOARD_ROUTES["exit-interview"]} className={BANNER_LINK_CLASS}>
          Open Exit Survey →
        </Link>
      </div>
    );
  }

  return null;
}
