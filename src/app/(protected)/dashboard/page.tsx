"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_ROUTES, defaultDashboardPathForRoles } from "@/constants/routes";
import { shouldRequireSelfOnboardingForUser } from "@/utils/userStatus";

export default function DashboardPage() {
  const { user, status, allRoles } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    // INVITED/ONBOARDING employees must complete the onboarding form first —
    // route them to Profile (the only page that renders the form). Staff-portal
    // users (HR/Admin/Manager/…) are exempt so a missing status never traps them.
    if (shouldRequireSelfOnboardingForUser(user.status, allRoles)) {
      router.replace(DASHBOARD_ROUTES.profile);
      return;
    }
    router.replace(defaultDashboardPathForRoles(user.roles));
  }, [status, user, allRoles, router]);

  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-wt-text-muted">
      Loading workspace…
    </div>
  );
}
