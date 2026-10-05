"use client";

import Link from "next/link";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Plane, Search, Settings2 } from "lucide-react";

import { AddWidgetMenu } from "@/components/dashboard/home/AddWidgetMenu";
import { Button } from "@/components/ui/button";
import { HOME_GRID_COPY } from "@/constants/homeGrid";
import { DASHBOARD_ROUTES } from "@/constants/routes";

interface HomeHeaderProps {
  eyebrow: string;
  title: string;
  editMode: boolean;
  onEditModeChange: (editing: boolean) => void;
  hiddenWidgets: { id: string; title: string }[];
  onShowWidget: (id: string) => void;
  onReset: () => void;
  onSearch: () => void;
  /** Zero-based current screen and how many screens there are; the pager hides when there is one. */
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

/** One compact row: who/when on the left, quick actions, customise and the screen pager on the right. */
export function HomeHeader({
  eyebrow,
  title,
  editMode,
  onEditModeChange,
  hiddenWidgets,
  onShowWidget,
  onReset,
  onSearch,
  page,
  pages,
  onPageChange,
}: HomeHeaderProps) {
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--wt-brand)]">{eyebrow}</p>
        <h1 className="truncate text-xl font-bold tracking-[-0.02em] text-wt-text sm:text-2xl">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {editMode ? (
          <>
            <AddWidgetMenu hiddenWidgets={hiddenWidgets} onShow={onShowWidget} />
            <Button variant="outline" size="sm" onClick={onReset}>
              Reset layout
            </Button>
            <Button variant="brand" size="sm" onClick={() => onEditModeChange(false)}>
              <Check className="size-4" /> Done
            </Button>
          </>
        ) : (
          <>
            <Button variant="brand" size="sm" render={<Link href={`${DASHBOARD_ROUTES.leave}?tab=my`} />}>
              <Plane className="size-4" /> Apply for leave
            </Button>
            <Button variant="outline" size="sm" render={<Link href={DASHBOARD_ROUTES.timelog} />}>
              <CalendarDays className="size-4" /> Log time
            </Button>
            <Button variant="outline" size="sm" onClick={onSearch}>
              <Search className="size-4" /> Search
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEditModeChange(true)}>
              <Settings2 className="size-4" /> Customize
            </Button>
          </>
        )}
        {pages > 1 ? (
          <div className="flex items-center gap-1 rounded-lg border border-wt-border bg-wt-surface-1 p-0.5">
            <button
              type="button"
              aria-label={HOME_GRID_COPY.previousPage}
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
              className="grid size-7 place-items-center rounded-md text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-10 text-center text-xs tabular-nums text-wt-text-muted">
              {HOME_GRID_COPY.pageLabel(page + 1, pages)}
            </span>
            <button
              type="button"
              aria-label={HOME_GRID_COPY.nextPage}
              disabled={page >= pages - 1}
              onClick={() => onPageChange(page + 1)}
              className="grid size-7 place-items-center rounded-md text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
