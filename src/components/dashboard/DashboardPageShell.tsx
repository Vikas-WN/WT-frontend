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
        "wt-page-enter relative min-h-0 w-full min-w-0 flex-1 p-5 sm:p-6 md:p-8",
        "transition-[padding] duration-[var(--wt-duration)] ease-[var(--wt-ease)]",
        "[[data-density=compact]_&]:p-3 [[data-density=compact]_&]:sm:p-4 [[data-density=compact]_&]:md:p-5",
        PAGE_STACK_CLASS,
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--wt-brand)_7%,transparent),transparent_70%)] dark:opacity-60" />
      {children}
    </main>
  );
}
