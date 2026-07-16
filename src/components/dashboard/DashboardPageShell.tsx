import type { ReactNode } from "react";
import { PAGE_STACK_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";

export function DashboardPageShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "wt-page-enter min-h-0 w-full min-w-0 flex-1 p-4 sm:p-6 md:p-8",
        PAGE_STACK_CLASS,
        className
      )}
    >
      {children}
    </main>
  );
}
