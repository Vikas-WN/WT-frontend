"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";
import { DashboardNavProvider } from "@/components/dashboard/DashboardNavContext";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { UserPreferencesProvider } from "@/context/UserPreferencesContext";
import { WtLoaderCentered } from "@/components/dashboard/ui/WtLoader";

function PendingOnboardingGuard({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Source the onboarding requirement from the same live, self-correcting
  // status `useDashboardAccess` computes (it fetches the current /profile
  // record rather than trusting the JWT/session-derived `user.status`, which
  // only updates on login or an explicit token refresh). Without this, an
  // employee whose status changes server-side — completing onboarding, or
  // being marked Active by HR — without their session token rotating stays
  // stuck being redirected to Profile on every other route.
  const { requiresSelfOnboarding } = useDashboardAccess();
  const needsOnboarding =
    status === "authenticated" && !!user && requiresSelfOnboarding;
  const profilePath = DASHBOARD_ROUTES.profile;
  const settingsPath = DASHBOARD_ROUTES.settings;
  const isAllowedPath =
    pathname === profilePath ||
    pathname.startsWith(`${profilePath}/`) ||
    pathname === settingsPath ||
    pathname.startsWith(`${settingsPath}/`);
  const mustRedirect = needsOnboarding && !isAllowedPath;

  useEffect(() => {
    if (!mustRedirect) return;
    router.replace(profilePath);
  }, [mustRedirect, profilePath, router]);

  // Previously this always rendered `children` immediately and only redirected
  // afterwards from the effect above. Every page under /dashboard is reached
  // this way (only Profile/Leave/Offboarding separately re-check onboarding
  // status themselves), so an INVITED/ONBOARDING employee landing directly on
  // any other route — a bookmark, a stale email link, a typed URL — saw and
  // could interact with that page's full active-employee content for a render
  // (and for as long as the replace() takes to land) before ever being routed
  // to the onboarding form. Withholding children until the redirect decision
  // is settled closes that window everywhere at once, instead of requiring
  // every feature page to opt in individually.
  if (mustRedirect) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <WtLoaderCentered label="Redirecting to onboarding…" />
      </div>
    );
  }

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
