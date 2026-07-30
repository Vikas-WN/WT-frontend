import type { ReactNode } from "react";

/** Docs use a fixed light theme independent of dashboard dark mode. */
export default function ApiDocsLayout({ children }: { children: ReactNode }) {
  return (
    <div data-theme="light" className="api-docs-layout">
      {children}
    </div>
  );
}
