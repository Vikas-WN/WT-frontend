"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { shouldRequireSelfOnboardingForUser } from "@/utils/userStatus";
import { DashboardNavProvider } from "@/components/dashboard/DashboardNavContext";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { UserPreferencesProvider } from "@/context/UserPreferencesContext";

function PendingOnboardingGuard({ children }: { children: ReactNode }) {
  const { user, status, allRoles } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    if (!shouldRequireSelfOnboardingForUser(user.status, allRoles)) return;
    const profilePath = DASHBOARD_ROUTES.profile;
    const settingsPath = DASHBOARD_ROUTES.settings;
    if (pathname === profilePath || pathname.startsWith(`${profilePath}/`)) return;
    if (pathname === settingsPath || pathname.startsWith(`${settingsPath}/`)) return;
    router.replace(profilePath);
  }, [status, user, allRoles, pathname, router]);

  return <>{children}</>;
}

function DashboardChromeBoundary({ children }: { children: ReactNode }) {
  return (
    <DashboardNavProvider>
      <UserPreferencesProvider>
        <DashboardChrome>
          <PendingOnboardingGuard>{children}</PendingOnboardingGuard>
        </DashboardChrome>
      </UserPreferencesProvider>
    </DashboardNavProvider>
  );
}

export default function DashboardRouteLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardChromeBoundary>{children}</DashboardChromeBoundary>
  );
}
