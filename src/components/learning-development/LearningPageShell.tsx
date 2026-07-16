import type { ReactNode } from "react";

import { PAGE_STACK_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";

/** Same spacing contract as DashboardPageShell — Learning routes stay visually aligned. */
export function LearningPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "wt-page-enter min-h-0 w-full min-w-0 flex-1 p-5 sm:p-6 md:p-8",
        PAGE_STACK_CLASS,
        className
      )}
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-8">{children}</div>
    </main>
  );
}
