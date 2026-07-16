"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type PageTabItem = {
  value: string;
  label: string;
  disabled?: boolean;
};

/** Vertical space from card edge to tabs, and from divider to tab content. */
export const PAGE_TAB_EDGE_GAP_CLASS = "pt-5";

const PAGE_TABS_EMBEDDED_HEADER_CLASS = cn(
  "w-full border-b border-wt-border/80 px-5 sm:px-8",
  PAGE_TAB_EDGE_GAP_CLASS
);

/**
 * In-page section tabs — underline style for card headers.
 * Use `variant="segmented"` for compact filter-style tabs.
 */
export function PageTabs({
  value,
  onValueChange,
  items,
  className,
  embedded = false,
  variant = "line",
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange?: (value: string) => void;
  items: readonly PageTabItem[];
  className?: string;
  /** Tabs rendered at the top of a white content card. */
  embedded?: boolean;
  variant?: "line" | "segmented";
  "aria-label"?: string;
}) {
  if (!items.length) return null;

  const listVariant = variant === "segmented" ? "default" : "line";

  const tabsList = (
    <TabsList
      aria-label={ariaLabel}
      variant={listVariant}
      className={cn(
        listVariant === "line" && "h-auto w-full justify-start overflow-x-auto",
        listVariant === "default" && "w-fit"
      )}
    >
      {items.map((item) => (
        <TabsTrigger key={item.value} value={item.value} disabled={item.disabled}>
          {item.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );

  return (
    <Tabs value={value} onValueChange={onValueChange} className={cn("gap-0", className)}>
      {embedded && listVariant === "line" ? (
        <div className={PAGE_TABS_EMBEDDED_HEADER_CLASS}>{tabsList}</div>
      ) : (
        tabsList
      )}
    </Tabs>
  );
}

export const PAGE_CONTENT_CARD_CLASS = cn(
  "wt-surface-card rounded-2xl border border-wt-border bg-wt-surface-1",
  "dark:border-wt-border dark:shadow-none"
);

/** Use directly below embedded `PageTabs` for consistent tab-to-content spacing. */
export const PAGE_TAB_BODY_CLASS = cn(
  "pt-6",
  "space-y-7 px-5 pb-7 sm:px-8 sm:pb-8"
);
