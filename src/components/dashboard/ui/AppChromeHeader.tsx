import type { ReactNode } from "react";
import {
  DASHBOARD_HEADER_BAR_CLASS,
  DASHBOARD_HEADER_CLASS,
} from "@/components/dashboard/ui/sidebarLayout";

/** Two-layer chrome: surface (safe-area) wrapping the design-padded bar. */
export function AppChromeHeader({ children }: { children: ReactNode }) {
  return (
    <header className={DASHBOARD_HEADER_CLASS}>
      <div className={DASHBOARD_HEADER_BAR_CLASS}>{children}</div>
    </header>
  );
}
