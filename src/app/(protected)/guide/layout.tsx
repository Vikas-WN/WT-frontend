"use client";

import type { ReactNode } from "react";
import { DashboardNavProvider } from "@/components/dashboard/DashboardNavContext";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";
import { CommandPaletteProvider } from "@/components/dashboard/CommandPalette";
import { KeyboardShortcutsProvider } from "@/components/dashboard/KeyboardShortcuts";
import { UserPreferencesProvider } from "@/context/UserPreferencesContext";

export default function GuideRouteLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardNavProvider>
      <UserPreferencesProvider>
        <CommandPaletteProvider>
          <KeyboardShortcutsProvider>
            <DashboardChrome>{children}</DashboardChrome>
          </KeyboardShortcutsProvider>
        </CommandPaletteProvider>
      </UserPreferencesProvider>
    </DashboardNavProvider>
  );
}
