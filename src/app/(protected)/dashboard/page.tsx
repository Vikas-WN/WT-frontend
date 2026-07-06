"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";
import { defaultDashboardPathForRoles, DASHBOARD_ROUTES } from "@/constants/routes";

export default function DashboardPage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const { isExitSurveyOnlyAccess } = useDashboardAccess();

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    if (isExitSurveyOnlyAccess) {
      router.replace(DASHBOARD_ROUTES["exit-interview"]);
      return;
    }
    router.replace(defaultDashboardPathForRoles(user.roles));
  }, [status, user, router, isExitSurveyOnlyAccess]);

  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-wt-text-muted">
      Loading workspace…
    </div>
  );
}
