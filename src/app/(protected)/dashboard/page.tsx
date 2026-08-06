"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_ROUTES, defaultDashboardPathForRoles } from "@/constants/routes";
import { shouldRequireSelfOnboarding } from "@/utils/userStatus";

export default function DashboardPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    // INVITED/ONBOARDING users must complete the onboarding form first — route
    // them to Profile (the only page that renders the form) regardless of role.
    if (shouldRequireSelfOnboarding(user.status)) {
      router.replace(DASHBOARD_ROUTES.profile);
      return;
    }
    router.replace(defaultDashboardPathForRoles(user.roles));
  }, [status, user, router]);

  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-wt-text-muted">
      Loading workspace…
    </div>
  );
}
