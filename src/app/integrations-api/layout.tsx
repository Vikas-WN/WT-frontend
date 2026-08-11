import type { ReactNode } from "react";

/** Integration docs use a fixed light theme independent of dashboard dark mode. */
export default function IntegrationsApiLayout({ children }: { children: ReactNode }) {
  return (
    <div data-theme="light" className="api-docs-layout">
      {children}
    </div>
  );
}
