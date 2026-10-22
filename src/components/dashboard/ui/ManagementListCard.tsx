"use client";

import type { ReactNode } from "react";

import { PageHero } from "@/components/dashboard/ui/PageHero";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { TableRowsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import { UI_COPY } from "@/constants/uiCopy";
import { cn } from "@/lib/utils";

type ManagementListCardProps = {
  title: string;
  description?: string;
  headerAction?: ReactNode;
  /** A section inside a page that has its own heading: the title stays inside the card. */
  embedded?: boolean;
  /** Summary cards shown between the page heading and the list card. */
  aboveCard?: ReactNode;
  toolbar?: ReactNode;
  search?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Tighter padding and vertical rhythm for data-heavy list pages. */
  density?: "default" | "compact";
};

export function ManagementListCard({
  title,
  description,
  headerAction,
  aboveCard,
  embedded = false,
  toolbar,
  search,
  filters,
  children,
  className,
  density = "default",
}: ManagementListCardProps) {
  const hasToolbar = Boolean(toolbar || search || filters);
  const compact = density === "compact";

  return (
    <div className={cn("space-y-6 wt-soft-in", className)}>
      {embedded ? null : <PageHero title={title} description={description} action={headerAction} raw />}
      {aboveCard}
      <section className={cn("wt-list-workspace", compact && "wt-list-compact")}>
        {embedded ? <header className="wt-list-heading"><div className="min-w-0"><h2 className="text-base font-semibold text-wt-text">{title}</h2>{description ? <p className="mt-1 text-xs leading-relaxed text-wt-text-muted">{description}</p> : null}</div>{headerAction}</header> : null}
        {hasToolbar ? <div className="wt-list-toolbar">{toolbar ?? <div className="wt-management-toolbar">{search ? <div className="wt-management-search">{search}</div> : null}{filters ? <div className="wt-management-filters">{filters}</div> : null}</div>}</div> : null}
        <div className="wt-list-content">{children}</div>
      </section>
    </div>
  );
}

type ManagementListContentProps = {
  isLoading: boolean;
  isEmpty: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  skeletonRows?: number;
  skeletonColumns?: number;
  children: ReactNode;
};

export function ManagementListContent({
  isLoading,
  isEmpty,
  emptyTitle = UI_COPY.noRecordsFound,
  emptyDescription = UI_COPY.adjustFilters,
  emptyIcon,
  skeletonRows = 8,
  skeletonColumns = 4,
  children,
}: ManagementListContentProps) {
  if (isLoading) {
    return <TableRowsSkeleton rows={skeletonRows} columns={skeletonColumns} />;
  }

  if (isEmpty) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
    );
  }

  return <>{children}</>;
}
