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
        "wt-page-enter relative mx-auto min-h-0 w-full min-w-0 max-w-[1440px] flex-1 p-4 sm:p-5 md:px-6 md:py-6 xl:px-8",
        "transition-[padding] duration-[var(--wt-duration)] ease-[var(--wt-ease)]",
        "[[data-density=compact]_&]:p-3 [[data-density=compact]_&]:sm:p-4 [[data-density=compact]_&]:md:p-5",
        PAGE_STACK_CLASS,
        className
      )}
    >
      {children}
    </main>
  );
}
