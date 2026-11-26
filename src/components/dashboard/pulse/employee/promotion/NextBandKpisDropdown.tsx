"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { PathToPromotionPanel } from "@/components/dashboard/pulse/employee/promotion/PathToPromotionPanel";
import { NEXT_BAND_KPIS_COPY as COPY } from "@/constants/nextBandKpis";

/** Collapsible "Path to Promotion" shown under a submitted review. The KPIs are only fetched once it is opened. */
export function NextBandKpisDropdown() {
  // UI-only: remembers whether the dropdown was opened so the next-band KPIs load on first open, not on every review view.
  const [opened, setOpened] = useState(false);

  return (
    <details
      className="group rounded-2xl border border-wt-border bg-wt-surface-1"
      onToggle={(event) => {
        if (event.currentTarget.open) setOpened(true);
      }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-wt-text">{COPY.dropdownLabel}</span>
          <span className="block text-xs text-wt-text-muted">{COPY.dropdownHint}</span>
        </span>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-wt-text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-wt-border/80 p-4 sm:p-5">{opened ? <PathToPromotionPanel /> : null}</div>
    </details>
  );
}
