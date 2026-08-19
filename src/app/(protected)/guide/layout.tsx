"use client";

import type { ReactNode } from "react";
import { DashboardNavProvider } from "@/components/dashboard/DashboardNavContext";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { UserPreferencesProvider } from "@/context/UserPreferencesContext";

export default function GuideRouteLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardNavProvider>
      <UserPreferencesProvider>
        <DashboardChrome>{children}</DashboardChrome>
      </UserPreferencesProvider>
    </DashboardNavProvider>
  );
}
