import type { HTMLAttributes } from "react";
import { DEFAULT_TABLE_MAX_HEIGHT } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";

export const SCROLLABLE_TABLE_CLASS = "wt-scrollable-table text-sm";

export const STICKY_TABLE_HEAD_CLASS = "wt-table-sticky-head [&_tr]:border-b";

export const SCROLLABLE_TABLE_SHELL_CLASS =
  "rounded-xl border border-wt-border bg-wt-surface-1/50";

export const SCROLLABLE_TABLE_SHELL_CHAIN_CLASS =
  "rounded-xl border border-wt-border bg-wt-surface-1/50";

type ScrollableTableProps = HTMLAttributes<HTMLDivElement> & {
  maxHeightClass?: string;
  /** Allow scroll to continue on the parent once this region hits its edge. Default on for page tables. */
  scrollChain?: boolean;
  /**
   * `both` (default) — horizontal + vertical.
   * `y` — vertical only (no horizontal scrollbar; table must fit width).
   */
  axis?: "both" | "y";
};

/** Bounded scroll region so table header cells can stick while body scrolls. */
export function ScrollableTable({
  children,
  className = "",
  maxHeightClass = DEFAULT_TABLE_MAX_HEIGHT,
  scrollChain = true,
  axis = "both",
  ...props
}: ScrollableTableProps) {
  const scrollClass =
    axis === "y"
      ? scrollChain
        ? "wt-scroll-chain overflow-y-auto overflow-x-hidden"
        : "wt-scroll overflow-y-auto overflow-x-hidden"
      : scrollChain
        ? "wt-scroll-both-chain overflow-auto"
        : "wt-scroll-both overflow-auto";

  const shellClass = scrollChain
    ? SCROLLABLE_TABLE_SHELL_CHAIN_CLASS
    : SCROLLABLE_TABLE_SHELL_CLASS;

  return (
    <div
      className={cn(shellClass, scrollClass, maxHeightClass, className)}
      {...props}
    >
      {children}
    </div>
  );
}
