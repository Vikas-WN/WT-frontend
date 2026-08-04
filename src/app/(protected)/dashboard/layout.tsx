"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { shouldRequireSelfOnboarding } from "@/utils/userStatus";
import { DashboardNavProvider } from "@/components/dashboard/DashboardNavContext";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";

function PendingOnboardingGuard({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    if (!shouldRequireSelfOnboarding(user.status)) return;
    const profilePath = DASHBOARD_ROUTES.profile;
    if (pathname === profilePath || pathname.startsWith(`${profilePath}/`)) return;
    router.replace(profilePath);
  }, [status, user, pathname, router]);

  return <>{children}</>;
}

function DashboardChromeBoundary({ children }: { children: ReactNode }) {
  return (
    <DashboardNavProvider>
      <DashboardChrome>
        <PendingOnboardingGuard>{children}</PendingOnboardingGuard>
      </DashboardChrome>
    </DashboardNavProvider>
  );
}

export default function DashboardRouteLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardChromeBoundary>{children}</DashboardChromeBoundary>
  );
}
